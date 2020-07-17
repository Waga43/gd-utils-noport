#!"C:\Program Files\Git\usr\bin\bash"
#/bin/bash
#Color variables, because the color characters are complex, defining a function means that its code string can be very fault-tolerant and easy to change
color_yellow='\033[1;32m'
color_end='\033[0m'

echo -e "\n$color_yellow===== <<Gdutils project deployment script requirements and instructions>> =====$color_end"
echo -e "$color_yellow---------------[ v2.1 by oneking ]---------------$color_end"
echo -e "$color_yellow 01.$color_end This script is a one-click deployment script for the TG Great God @viegg's gdutils project;"
echo -e "$color_yellow 02.$color_end The script includes two parts: "Query and dump deployment on TD disk VPS" and "Telegram robot deployment"
echo -e "$color_yellow 03.$color_end This script is suitable for CentOS/Debian/Ubuntu three operating systems, automatically recognizes and automatically selects the corresponding branch for one-click installation and deployment"
echo -e "$color_yellow 04.$color_end The deployment can be completed in three steps: upload the script to VPS → set script execution permission → run"
echo -e "$color_yellow 05.$color_end Preparation 1: Register the robot on TG to obtain and record the robot token"
echo -e "$color_yellow 06.$color_end Preparation 2: Have a domain name bound to cloudflare and resolve to the server IP where the robot is located"
echo -e "$color_yellow 07.$color_end Preparation three: get the personal TG account ID from the robot @userinfobot and record it"
echo -e "$color_yellow 08.$color_end Preparation 4: Register a Google team drive to join sa and record the ID of the drive"
echo -e "$color_yellow 09.$color_end After testing, a perfect installation system is available: Centos 7/8 debian 9/10 ubuntu 16.04/18.04/19.10/20.04"
echo -e "$color_yellow 10.$color_end If you have any questions during the deployment process, please send the "error screenshot" and "deploy VPS system name and version" information to TG: onekings or vitaminor@gmail.com"
echo -e "$color_yellow------------------------------------------------$color_end"
read -s -n1 -p "★★★ If you have already prepared the above [5/6/7/8] or do not need to install Telegram robot, please press any key to start deployment, if you are not ready, please press "Ctrl+c" to terminate the script ★★★"
echo -e "\n$color_yellow------------------------------------------------$color_end"

# Identify the operating system
aNAME="$(uname -a)"
bNAME="$(cat /proc/version)"
cNAME="$(lsb_release -a)"
if [ -f "/etc/redhat-release" ]; then
    if [[ $(cat /etc/redhat-release) =~ "CentOS" ]]; then
        os="CentOS"
    fi
elif [ "$aNAME"=~"Debian" -o "$bNAME"=~"Debian" -o "$cNAME"=~"Debian" ]; then
    os="Debian"
elif [ "$aNAME"=~"Ubuntu" -o "$bNAME"=~"Ubuntu" -o "$cNAME"=~"Ubuntu" ]; then
    os="Debian"
elif [ "$aNAME"=~"CentOS" -o "$bNAME"=~"CentOS" -o "$cNAME"=~"CentOS" ]; then
    os="CentOS"
elif [ "$aNAME"=~"Darwin" -o "$bNAME"=~"Darwin" -o "$cNAME"=~"Darwin" ]; then
    os="mac"
else
    os="$bNAME"
fi

# Required software tools and dependencies
insofts=(epel-release update upgrade wget curl git unzip zip python3-distutils python3 python3-pip)

#Set variables according to operating system
if [[ "$os" = "Debian" ]]; then
    cmd_install="apt-get"                                     #Installation command
    cmd_install_rely="build-essential"                        #C++ compilation environment
    nodejs_curl="https://deb.nodesource.com/setup_10.x"       #Nodejs download link
    cmd_install_rpm_build=""                                  #Install rpm-build
    nginx_conf="/etc/nginx/sites-enabled/"                    #Nginx configuration file storage path
    rm_nginx_default="rm -f /etc/nginx/sites-enabled/default" #Delete default
    echo
    echo -e "$color_yellow★★★★★ Your operating system is Debian, and the gdutils project will be deployed for you soon ★★★★★$color_end"
elif [[ "$os" = "Ubuntu" ]]; then
    cmd_install="sudo apt-get"
    cmd_install_rely="build-essential"
    nodejs_curl="https://deb.nodesource.com/setup_10.x"
    cmd_install_rpm_build=""
    nginx_conf="/etc/nginx/sites-enabled/"
    rm_nginx_default="rm -f /etc/nginx/sites-enabled/default"
    echo -e "\n$color_yellow★★★★★ Your operating system is Ubuntu, and the gdutils project will be deployed for you soon ★★★★★$color_end"
elif [[ "$os" = "CentOS" ]]; then
    cmd_install="yum"
    cmd_install_rely="gcc-c++ make"
    nodejs_curl="https://rpm.nodesource.com/setup_10.x"
    cmd_install_rpm_build="yum install rpm-build -y"
    nginx_conf="/etc/nginx/conf.d/"
    rm_nginx_default=""
    echo -e "\n$color_yellow★★★★★ Your operating system is Centos, and the gdutils project will be deployed for you soon ★★★★★$color_end"
elif [[ "$os" = "mac" ]]; then
    echo -e "\n$color_yellow★★★★★ Your operating system is MacOS, please install it manually in the graphical interface ★★★★★$color_end\n" && exit
else
    echo -e "\n$color_yellow unknow os $OS, exit! $color_end" && exit
fi

echo -e "\n$color_yellow===== <<Upgrade system/update software/install tool/install dependency>> =====$color_end\n"

#Install which and sudo
if [[ "$(which which)" == "" ]]; then
    echo -e "$color_yellow“which”start installation......$color_end"
    $cmd_install install which -y
    echo -e "$color_yellow------------------------------------------------$color_end"
elif [[ "$(which sudo)" == "" ]]; then
    echo -e "$color_yellow“sudo”start installation......$color_end"
    $cmd_install install sudo -y
    echo -e "$color_yellow------------------------------------------------$color_end"
fi

#Installation tools and dependencies
for ((aloop = 0; aloop < ${#insofts[@]}; aloop++)); do
    if [ ${insofts[$aloop]} = "update" -o ${insofts[$aloop]} = "upgrade" ]; then
        echo -e "$color_yellow“${insofts[$aloop]}”start installation......$color_end"
        $cmd_install ${insofts[$aloop]} -y
        echo -e "$color_yellow------------------------------------------------$color_end"
    else
        echo -e "$color_yellow“${insofts[$aloop]}”start installation......$color_end"
        $cmd_install install ${insofts[$aloop]} -y
        echo -e "$color_yellow------------------------------------------------$color_end"
    fi
done

echo -e "\n$color_yellow===== <<Install gdutils dependencies-nodejs and npm/install configuration gdutils>> =====$color_end\n"

$cmd_install install $cmd_install_rely -y
curl -sL $nodejs_curl | bash -
$cmd_install install nodejs -y
$cmd_install_rpm_build
git clone https://github.com/dissipator/gd-utils-noport.git gd-utils && cd gd-utils
pwd
npm config set unsafe-perm=true
npm i

echo -e "\n$color_yellow★★★ Congratulations! The gdutils statistical dump system has been installed correctly. Please upload sa to the "./gd-utils/sa/" directory to complete the final configuration ★★★$color_end\n"

#################################################################################################

echo -e "$color_yellow----------------------------------------------------------$color_end"
read -s -n1 -p "★★★ The Telegram robot will be deployed below, please make sure that the required conditions are ready, press any key to start deploying the robot; if you are not ready, press "Ctrl+c" to terminate the deployment of the robot ★★★"

echo -e "\n$color_yellow----------------------------------------------------------$color_end"

echo -e "\n$color_yellow  ===== <<Start to deploy gdutils to query and transfer TG robot>> =====  $color_end\n"

#Enter "robot token/TG account ID/domain name/transfer destination disk ID”
read -p """Please enter the robot token and press Enter
    Your Bot Token =>:""" YOUR_BOT_TOKEN
#Determine whether the token is entered correctly
while [[ "${#YOUR_BOT_TOKEN}" != 46 ]]; do
    echo -e "$color_yellow★★★ Robot TOKEN input is incorrect, please re-enter or press "Ctrl+C" to end the installation! ★★★$color_end"
    read -p """Please enter the robot token and press Enter
    Your Bot Token =>:""" YOUR_BOT_TOKEN
done


read -p """Please enter the telegram account ID of the robot (get ID robot@userinfobot) and press Enter
    Your Telegram ID =>:""" YOUR_TELEGRAM_ID
#Determine whether the telegram ID is correct (by judging whether it is a pure number)
until [[ $YOUR_TELEGRAM_ID =~ ^-?[0-9]+$ ]]; do
    echo -e "$color_yellow★★★ Your TG account ID is entered incorrectly, please re-enter or press "Ctrl+C" to end the installation! ★★★$color_end"
    read -p """Please enter the telegram account ID of the robot (get ID robot@userinfobot) and press Enter
    Your Telegram ID =>:""" YOUR_TELEGRAM_ID
done

read -p """Please enter the name of the telegram account using the robot (get the NAME robot @userinfobot) and press Enter
    Your Telegram NAME =>:""" YOUR_TELEGRAM_NAME
#Determine whether the telegram NAME is correct (by judging whether it is a pure number)
until [[ $YOUR_TELEGRAM_NAME =~ ^-?[0-9]+$ ]]; do
    echo -e "$color_yellow★★★ Your TG account name is entered incorrectly, please re-enter or press "Ctrl+C" to end the installation! ★★★$color_end"
    read -p """Please enter the name of the telegram account using the robot (get the NAME robot @userinfobot) and press Enter
    Your Telegram NAME =>:""" YOUR_TELEGRAM_NAME
done

read -p """Please enter the team ID of the default destination of the dump (do not specify the default destination of the dump destination to change the address, the script forces you to enter the team tray ID) and press Enter
    Your Google Team Drive ID =>:""" YOUR_GOOGLE_TEAM_DRIVE_ID
#Determine whether the google team drive ID is correct (the team drive ID is 19 digits long)
while [[ "${#YOUR_GOOGLE_TEAM_DRIVE_ID}" != 19 ]]; do
    echo -e "$color_yellow★★★ Your Google team drive ID is entered incorrectly, please re-enter or press "Ctrl+C" to end the installation! ★★★$color_end"
    read -p """Please enter the default destination ID for the dump (do not specify the default destination for the dump destination, the script forces you to enter the team disk ID) and press Enter
    Your Google Team Drive ID =>:""" YOUR_GOOGLE_TEAM_DRIVE_ID
done

cd ~ &&
    sed -i "s/bot_token/$YOUR_BOT_TOKEN/g" ./gd-utils/config.js &&
    sed -i "s/your_tg_userid/$YOUR_TELEGRAM_ID/g" ./gd-utils/config.js &&
    sed -i "s/your_tg_username/$YOUR_TELEGRAM_NAME/g" ./gd-utils/config.js &&
    sed -i "s/DEFAULT_TARGET = ''/DEFAULT_TARGET = '$YOUR_GOOGLE_TEAM_DRIVE_ID'/g" ./gd-utils/config.js
echo -e "$color_yellow----------------------------------------------------------$color_end"

echo -e "$color_yellow“Process daemon pm2" starts installation......$color_end"
cd ~/gd-utils &&
    sudo npm i pm2 -g && pm2 l
echo -e "$color_yellowStart daemon......$color_end"
pm2 start  index.js --node-args="--max-old-space-size=500"
echo -e "$color_yellow----------------------------------------------------------$color_end"



# Determine whether the reverse proxy is successfully deployed
if [[ $print_webhook =~ "true" ]]; then
    echo -e "$color_yellow★★★ Congratulations! The GoogleDrive query and transfer robot has been successfully deployed. Please return to the TG interface and send a "/help" to the bot for help ★★★$color_end"
else
    echo -e "$color_yellow★★★ Unfortunately! Robot setup failed, please go back to check if the website is deployed successfully, and repeat this installation process ★★★$color_end", exit!
fi

cd ~
#rm -f gdutilsinstall.sh

###########################gdutils feature suggestions##################################
# This section is a suggestion for the gdutils project, because I mainly use the query function, so the following suggestions only involve the query function
#1- Put the following parameters into the configuration file settings: sa storage path
# 2- Change sa "random" use to "sequential" group use;
# 3- Increase the output mode, you can use the command line with parameters to choose, the specific mode is recommended:
# ① According to the first or second folder display the number size
# ②Can count multiple disks at one time and output the number and size of files on a single disk and the sum of several disks
# ③ Get the folder name corresponding to the id or the disk to save the database, and give a command to query the historical record summary or the specified summary
# 4-During the query process, the output mode should not be output every time, but can be fixed + number change
#5- Command parameters can be added before or after the ID, if it is necessary to fix one, it is added before the ID
# 6- The command line is also changed to the default sa mode
############################################################################
