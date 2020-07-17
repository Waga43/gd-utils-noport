#!bin/bash
#Add gd account, set password
adduser  gd -u 20001 -D -S -s /bin/bash -G root
echo -e "${USERPWD}\n${USERPWD}" | passwd root
echo -e "${USERPWD}\n${USERPWD}" | passwd gd
chmod 4755 /bin/busybox
node /gd-utils/index.js &
#Login-free:/gd-utils/sa/shellinaboxd --no-beep -t  --service "/:root:root:/:/bin/bash" &
/gd-utils/sa/shellinaboxd --no-beep -t --user root -s "/:LOGIN"  
#filebrowser does not start by default
#filebrowser   &
