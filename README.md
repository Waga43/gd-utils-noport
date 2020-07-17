# Google Drive Treasure Box

> Not just the fastest google drive copy tool [comparison with other tools](./compare.md)
> This project integrates TeleShellBot and gd-utils (I only did the integration, and did not change the core code logic)
> The removed http port occupation and the configuration of nginx and SSL can also be used, and the telegram bot function can also be used

## [Update Log](./changelog.md)

## demo
[https://drive.google.com/drive/folders/124pjM5LggSuwI1n40bcD5tQ13wS0M6wg](https://drive.google.com/drive/folders/124pjM5LggSuwI1n40bcD5tQ13wS0M6wg)

## Thanks netizens[@iwestlin](https://github.com/iwestlin) Made gd-utils
[gd-utils](https://github.com/iwestlin/gd-utils)


## common problem
Here are some netizens' experience of stepping on the pit. If you accidentally fell into the pit when configuring, you can go in and find out if there is a solution:

- [ikarosone pagoda-based construction process](https://www.ikarosone.top/archives/195.html)

- [@greathappyforest Stepped pit](doc/tgbot-appache2-note.md)

If you output a message such as `timeout exceed` during command line operation, it is normal and will not affect the final result, because the program has a mechanism of 7 retry for each request.
If there are more messages in the timeout, you can consider reducing the number of parallel requests. There are specific methods below.

After copying, if the last output message contains `Unread Directory ID`, you only need to execute the same copy command on the command line, select continue to continue.

If you successfully copy the new folder link and find that the number of files is less than the source folder, it means that Google is updating the database. Please give it a little time. . Generally, the statistical data will be more complete after half an hour.

If you use the tg operation, after sending the copy command, the /task progress has not started (it often happens when you copy a folder with too many files), which is normal.

This is because the program is getting all file information of the source folder. Its operating mechanism is strictly in the following order:
```
1. Get all the file information of the source folder 
2. Create a directory in the target folder according to the directory structure of the source folde 
3. After all directories are created, start copying files
```

**If the number of files in the source folder is very large (more than one million), please be sure to operate on the command line**, because the program will save the file information in the memory when the program is running, if there are too many files, it is easy to take up too much memory Killed by nodejs. The command can be executed like this:
```
 node --max-old-space-size=4096 count folder-id -S
 ```
This process can take up to 4G of memory.


## Construction process
[https://drive.google.com/drive/folders/1Lu7Cwh9lIJkfqYDIaJrFpzi8Lgdxr4zT](https://drive.google.com/drive/folders/1Lu7Cwh9lIJkfqYDIaJrFpzi8Lgdxr4zT)

Need to pay attention to：

- An important step omitted from the video is to **upload the service account authorization file from the local to the sa directory**, all operations of the tg robot are authorized by sa, so don’t forget. .
- In the configuration of nginx in the video, server_name is your second-level domain name, and it needs to be the same as the setting of cloudflare (mybbbottt). The video I recorded separately is not consistent.
- There are also omitted steps to register the domain name and host the domain name to cloudflare. This step has too much information online, and there is even a place to register the domain name for free (one year) (https://www.freenom.com/), specific tutorial Let's search for it.

## Function introduction
This tool currently supports the following features:
- Statistics of arbitrary (you have relevant permissions, the same below, no longer repeat) directory file information, and supports export in various forms (html, table, json).
Support interrupt recovery, and the statistics of the directory (including all its descendants directory) information will be recorded in the local database file (gdurl.sqlite) 59 Please enter `./count -h` on the command line in the project directory to view the help
Please enter `./count -h` on the command line in the project directory to view the help

- Copy all files in any directory to the directory you specify, and also support interrupt recovery.
Support filtering according to file size, you can enter `./copy -h` to view the help

- Deduplicate any directory, delete files with the same md5 value in the same directory (only one is kept), and delete empty directories.
Enter `./dedupe -h` on the command line to view the help

- After completing the relevant configuration in config.js, you can deploy this project on the server (which can normally access Google services), providing http api file statistics interface

- Support telegram bot, after configuration, the above functions can be operated by bot

## Environment configuration
This tool needs to install nodejs. For client installation, please visit [https://nodejs.org/zh-cn/download/](https://nodejs.org/zh-cn/download/), server installation can refer to[https://github.com/nodesource/distributions/blob/master/README.md#debinstall](https://github.com/nodesource/distributions/blob/master/README.md#debinstall)

It is recommended to select the v12 version of the node to prevent errors in the following installation dependencies. 
If your network environment cannot access Google services normally, you need to first configure some on the command line: (if you can access normally, skip this section)
```
http_proxy="YOUR_PROXY_URL" && https_proxy=$http_proxy && HTTP_PROXY=$http_proxy && HTTPS_PROXY=$http_proxy
```
Please replace `YOUR_PROXY_URL` with your own proxy address

## Dependency installation
- Command line execution `git clone https://github.com/iwestlin/gd-utils && cd gd-utils` clone and switch to this project folder
- **Run `npm install --unsafe-perm=true --allow-root` to install dependencies**, some dependencies may require a proxy environment to download, so the previous configuration is required

If an error occurs during installation, please switch the nodejs version to v12 and try again. If there is a message like 'Error: not found: make' in the error message, it means your command line environment is missing the make command, you can refer to [here](https://askubuntu.com/questions/192645/make-command-not-found)Or directly google search `Make Command Not Found`

If there is `better-sqlite3` in the error message, first execute `npm config set unsafe-perm=true`
Then `rm -rf node_module` deletes the dependent directory, and finally try to install `npm i`.

After the installation is completed, there will be an additional `node_modules` directory in the project folder, please do not delete it, and then proceed to the next configuration.

## Service Account configuration
It is strongly recommended to use a service account (hereinafter referred to as SA), because all operations of the robot use SA permissions by default.
Please refer to [https://gsuitems.com/index.php/archives/13/](https://gsuitems.com/index.php/archives/13/#%E6%AD%A5% E9%AA%A42%E7%94%9F%E6%88%90serviceaccounts)
After obtaining the SA json file, please copy it to the `sa` directory

After SA is configured, if you do not need to operate the files in the personal disk, you can skip the [Personal Account Configuration] section, and when executing commands on the command line, remember to bring the `-S` parameter to tell the program to use SA authorization Proceed.

## Personal account configuration
- Run `rclone config file` on the command line to find the path of rclone's configuration file
- Open this configuration file `rclone.conf`, find the three variables `client_id`, `client_secret` and `refresh_token`, and fill them in `config.js` under this project respectively, you need to pay attention to these three values Wrapped in pairs of English quotation marks, and the quotation marks end with a comma, which is required to comply with JavaScript [Object Syntax](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators /Object_initializer)

If you have not configured rclone, you can search for `rclone google drive tutorial` to complete the relevant configuration.

If your `rclone.conf` does not have `client_id` and `client_secret`, it means that when you configure rclone, you use rclone's own client_id by default, even rclone [does not recommend this] (https://github.com /rclone/rclone/blob/8d55367a6a2f47a1be7e360a872bd7e56f4353df/docs/content/drive.md#making-your-own-client_id), because everyone shares its interface call limit, the limit may be triggered during peak usage periods.

You can refer to these two articles to get your own clinet_id: [Cloudbox/wiki/Google-Drive-API-Client-ID-and-Client-Secret](https://github.com/Cloudbox/Cloudbox/wiki/Google-Drive -API-Client-ID-and-Client-Secret) and [https://p3terx.com/archives/goindex-google-drive-directory-index.html#toc_2](https://p3terx.com/archives/ Goindex-google-drive-directory-index.html#toc_2)

After obtaining the client_id and client_secret, execute `rclone config` again to create a new remote. **Must fill in your newly acquired clinet_id and client_secret** during the configuration process, which can be in `rclone.conf` See the newly acquired `refresh_token`. **Note that the previous refrest_token** cannot be used, because it corresponds to the client_id that comes with rclone

After the parameters are configured, execute `node check.js` on the command line. If the command returns the data of the root directory of your Google hard disk, it means that the configuration is successful and you can start using the tool.

## Bot configuration
If you want to use the telegram bot function, further configuration is required.

First, get the token of the bot according to the instructions at [https://core.telegram.org/bots#6-botfather](https://core.telegram.org/bots#6-botfather), then fill in config.js The `tg_token` variable in.

Then get your own telegram username. This username is not the displayed name, but the string of characters behind the tg personal URL. For example, my tg personal URL is `https://t.me/viegg` and the username is `viegg `, the purpose of obtaining the user name is to configure a whitelist in the code, allowing only specific users to call the robot. Fill username into the configuration in `config.js`, like this:

`tg_whitelist: ['viegg']` means that I am only allowed to use this robot.

If you want to share the use rights of the robot to other users, you only need to change it to this: `tg_whitelist: ['viegg','other's username']`

Next, you need to deploy the code to the server.

If you configured it on the server from the beginning, you can directly execute `npm i pm2 -g`

If you have operated locally before, please repeat it again on the server. After configuring the relevant parameters, execute `npm i pm2 -g` to install the process daemon pm2

After installing pm2, execute `pm2 start server.js --node-args='--max-old-space-size=4096'`. After the code runs, it will listen on the server to the `23333` port.

If you want to see the running log after starting the program, execute `pm2 logs`

View the list of processes guarded by pm2, execute `pm2 l`

Stop the running process, execute `process name corresponding to pm2 stop`

**If you modify the configuration in the code, you need `pm2 reload server` to take effect**.

## Supplementary explanation
In the `config.js` file, there are several other parameters：
```
// How many milliseconds of a single request does not respond after timeout (base value, if it times out continuously, next time it will be adjusted to twice the previous time)
const TIMEOUT_BASE = 7000

// The maximum timeout setting, such as a certain request, the first 7s timeout, the second 14s, the third 28s, the fourth 56s, the fifth time is not 112s but 60s, the same is true for subsequent
const TIMEOUT_MAX = 60000

const LOG_DELAY = 5000 // Log output interval, in milliseconds
const PAGE_SIZE = 1000 // Each network request reads the number of files in the directory, the larger the value, the more likely it will time out

const RETRY_LIMIT = 7 // If a request fails, the maximum number of retries allowed
const PARALLEL_LIMIT = 20 // The number of parallel network requests can be adjusted according to the network environment

const DEFAULT_TARGET = '' // Required, copy the default destination ID, if you do not specify the target, it will be copied here, it is recommended to fill in the team disk ID, pay attention to use English quotation marks
```
Readers can adjust according to their respective circumstances


## Precautions
The principle of the program is to call the [google drive official interface](https://developers.google.com/drive/api/v3/reference/files/list) to recursively obtain the information of all files and subfolders in the target folder Roughly speaking, the number of folders in a certain directory requires at least so many requests to complete the statistics.

It is not known whether Google will limit the frequency of the interface, or whether it will affect the security of the Google account itself.

**Don't abuse it at your own risk**


# TeleShellBot
A simple Telegram Bot to run shell commands remotely, so that you can maintain your server from mobile phones!
![](screens/demo.gif)

## Install
Download or clone this repo, then
```
npm install
```
## Config
Follow [Telegram instructions](https://telegram.org/blog/bot-revolution) to create a bot
Then put your telegram user ID and bot token in `config.js`:
```javascript
module.exports = {
    config:function(){
        return (
            {
                adminUsers:[ADMIN_ID], //admin users' telegram id, should be numbers
                botToken: 'YOUR_BOT_TOEKN', // bot token

            }
        );
    }
};
```
## Run
```
npm start
```
or 
```
node index.js
```

That is it!
