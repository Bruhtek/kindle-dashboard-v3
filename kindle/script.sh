#!/bin/zsh

LOG="/mnt/us/kindle.log"
SERVER_ADDRESS="http://192.168.1.3:5000"
VERBOSE=0

SLEEP_TIME=1800 # seconds

prepare_kindle() {
  initctl stop framework        2>&1 | log
  initctl stop cmd              2>&1 | log
#  initctl stop volumd           2>&1 | log # This also kills USBNetwork - makes the kindle go to the USB drive mode when connected to a computer
  initctl stop webreader        2>&1 | log
  killall lipc-wait-event       2>&1 | log

  touch /mnt/us/WIFI_NO_NET_PROBE
}

wifi_status() {
  lipc-get-prop com.lab126.wifid cmState | grep -o "CONNECTED"
}

trail_log() {
  # Retain only the last 1000 lines from the log
  tail -n 1000 $LOG > $LOG.tmp
  mv $LOG.tmp $LOG
}

LOG_LINE=0
LOG_MAX_LINES=50

# shellcheck disable=SC2120
log() {
  if [ -n "$1" ]; then
    IN="$1"
  else
    read -r IN
  fi


  echo "$(date '+%Y-%m-%d %H:%M:%S') $IN"
  echo "$(date '+%Y-%m-%d %H:%M:%S') $IN" >> $LOG
  if [ "$VERBOSE" -eq 1 ]; then
    fbink -q -y "$LOG_LINE" "$(date '+%H:%M:%S') $IN"

    LOG_LINE=$((LOG_LINE + 1))
    if [ "$LOG_LINE" -gt "$LOG_MAX_LINES" ]; then
      LOG_LINE=0
      fbink -q -c
    fi
  fi
}

setup_kindle() {
  trail_log

  # Clear the screen
  fbink -q -c

  # Prepare the kindle for displaying the dashboard
  prepare_kindle

  # Disable the screensaver
  SCREENSAVER=$(lipc-get-prop com.lab126.powerd status | grep -c "prevent_screen_saver:1")
  if [ "$SCREENSAVER" -eq 0 ]; then
    lipc-set-prop com.lab126.powerd preventScreenSaver 1 2>&1 | log
  fi

  echo "Kindle setup complete" | log
}

battery() {
  gasgauge-info -s
}

LOOP_NUM=0
BATTERY=$(battery)

PREDICTED_WAKEUP_TIME=-1
USER_WAKE_COUNT=0
SHOULD_LOOP=1

clean_up() {
  log "Cleaning up"
  initctl start framework        2>&1 | log
  initctl start cmd              2>&1 | log
  initctl start volumd           2>&1 | log
  initctl start webreader        2>&1 | log
}

# Setup the kindle
setup_kindle

log "Starting the main loop in 5 seconds. If you are using a terminal, please disconnect now"
sleep 4
log "Starting the main loop in 1 second"
sleep 1

while [ "$SHOULD_LOOP" -eq 1 ]; do
  LOOP_NUM=$((LOOP_NUM + 1))
  BATTERY=$(battery)
  CURRENT_TIME=$(date +%s)

  log "Looping: $LOOP_NUM - Battery: ${BATTERY}% - U: $USER_WAKE_COUNT"

  if [ "$PREDICTED_WAKEUP_TIME" -gt 0 ]; then
    # If the current time is less then the predicted wakeup time, user has woken up the kindle
    if [ "$CURRENT_TIME" -lt "$PREDICTED_WAKEUP_TIME" ]; then
      USER_WAKE_COUNT=$((USER_WAKE_COUNT + 1))
      log "User woke up the kindle: $USER_WAKE_COUNT"
    else
      USER_WAKE_COUNT=0
    fi
  fi

  if [ "$USER_WAKE_COUNT" -eq 3 ]; then
    log "User woke up the kindle 3 times, exiting"
    SHOULD_LOOP=0
    clean_up
    exit 0
  fi

  # Give it 5 seconds to settle down
  log "Reassociating with the wifi network"
  log "$(wpa_cli -i wlan0 reassociate)"
  sleep 3

  # Main loop
  curl --output image.png --connect-timeout 15 -s "$SERVER_ADDRESS?battery=$BATTERY&user=$USER_WAKE_COUNT"
  if [ $? -ne 0 ]; then
    log "Failed to get Data"
    log "Wifi status: $(wifi_status)"
    log "cmState: $(lipc-get-prop com.lab126.wifid cmState)"
  else
    log "Got the image"
    fbink -c
    sleep 1
    fbink -g file=image.png
  fi

    #  # Main loop - just get random local server website for now
    #  DATA=$(curl http://inanis.local -m 5)
    #  if [ -z "$DATA" ]; then
    #    log "Failed to get Data"
    #    log "Wifi status: $(wifi_status)"
    #    log "cmState: $(lipc-get-prop com.lab126.wifid cmState)"
    #  fi
    #  log "Data: '$DATA'"

  # Subtract 5 seconds to account for the time taken to wake up
  PREDICTED_WAKEUP_TIME=$(($(date +%s) + SLEEP_TIME - 5))

  rtcwake -m mem -d /dev/rtc1 -s $SLEEP_TIME
done

clean_up
