# [gd-utils](https://github.com/iwestlin/gd-utils) Docker version, quickly build google drive dump tool

**Included in docker:**
- **Web shell**: easy to execute commands such as git pull
- **File manager**, easy to upload sa file and edit configuration file and backup database
- **gd-utils robot**
> For specific gd-utils tutorials, please go to the official website: [gd-utils](https://github.com/iwestlin/gd-utils)




# Instructions:
Docker version of gd-utils, how to use:


**4200 port: **webshell, account: `gd`, password: `your_self_passsword`

**Port 23333: ** gd-utils robot

**Port 80: **File management, **Not activated by default** **Not activated by default** **Not activated by default**
> Startup method: log in to webshell; `su root` and execute `cd / && filebrowser &`, account password: admin

**Persistence directory: ** /gd-utils/

```
docker run --restart=always  -d \
-e USERPWD="your_self_passsword" \
-p 4200:4200 \
-p 80:80 \
-p 23333:23333 \
--name gd-utils \
-v /gd-utils:/root/gd-utils \
gdtool/gd-utils-docker
```

## Original project
[gd-utils](https://github.com/iwestlin/gd-utils)

## Related projects (thanks to these open source projects)

[gd-utils](https://github.com/iwestlin/gd-utils)

[shellinabox](https://github.com/shellinabox/shellinabox)

[filebrowser](https://github.com/filebrowser/filebrowser/)

## Script reference

[iouAkira](https://github.com/iouAkira/someDockerfile)

[mics8128](https://github.com/mics8128/gd-utilds-docker)
