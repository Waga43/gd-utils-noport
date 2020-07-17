const TeleBot = require('telebot');
const { spawn } = require('child_process');

const { db } = require('./db');
const { validate_fid, gen_count_body, count } = require('./src/gd');
const { send_count, send_help, send_choice, send_task_info, sm, extract_fid, extract_from_text, reply_cb_query, tg_copy, send_all_tasks, send_bm_help, get_target_by_alias, gen_bookmark_choices, send_all_bookmarks, set_bookmark, unset_bookmark, clear_tasks, send_task_help, rm_task } = require('./src/tg');
const { AUTH, ROUTER_PASSKEY, TG_IPLIST } = require('./config')
const { tg_whitelist } = AUTH
const { tg_token } = AUTH
const { adminUsers } = AUTH
const bot = new TeleBot(tg_token);


const COPYING_FIDS = {}
const counting = {}


bot.on('text', (msg) => {

    const chat_id = msg && msg.chat && msg.chat.id
    // console.log(msg);
    // console.log('chat_id:   '+ chat_id);
    const id = msg.from.id;
    if(adminUsers.indexOf(id) < 0){
        msg.reply.text('You are not admin!');
        return;
    }

    // let prex = String(msg.text).substring(0,1);
    // console.log(prex);
    let words = String(msg.text).split(" ");
    let len = words.length;
    let args = [];
    if (len > 1 ){
        args = words.slice(1, len);

    }

    // console.log('reply:'+msg.text);
    // console.log('args:'+args);
    let is_shell = false


      const text = msg && msg.text && msg.text.trim()
      let username = msg && msg.from && msg.from.username
      msgs = username && String(username).toLowerCase()
      let user_id = msgs && msgs.from && msgs.from.id
      user_id = user_id && String(user_id).toLowerCase()
      if (!chat_id || !text || !tg_whitelist.some(v => {
        v = String(v).toLowerCase()
        return v === username || v === user_id
      })) return console.warn('Abnormal request')

        const fid = extract_fid(text) || extract_from_text(text)
        const no_fid_commands = ['/task', '/help', '/bm']
        if (!no_fid_commands.some(cmd => text.startsWith(cmd)) && !validate_fid(fid)) {
          // console.log("is_shell:"+is_shell);
          sm({ chat_id, text: 'Share ID not recognized' })
          is_shell = true
        }
        if (text.startsWith('/help')) return send_help(chat_id)
        if (text.startsWith('/bm')) {
          const [cmd, action, alias, target] = text.split(' ').map(v => v.trim())
          if (!action) return send_all_bookmarks(chat_id)
          if (action === 'set') {
            if (!alias || !target) return sm({ chat_id, text: 'Alias ​​and target ID cannot be empty' })
            if (alias.length > 24) return sm({ chat_id, text: 'Aliases should not exceed 24 English characters in length' })
            if (!validate_fid(target)) return sm({ chat_id, text: 'Incorrect target ID format' })
            set_bookmark({ chat_id, alias, target })
          } else if (action === 'unset') {
            if (!alias) return sm({ chat_id, text: 'Alias ​​cannot be empty' })
            unset_bookmark({ chat_id, alias })
          } else {
            send_bm_help(chat_id)
          }
        } else if (text.startsWith('/count')) {
          if (counting[fid]) return sm({ chat_id, text: fid + ' Statistics, please wait a moment' })
          try {
            counting[fid] = true
            const update = text.endsWith(' -u')
            send_count({ fid, chat_id, update })
          } catch (err) {
            console.error(err)
            sm({ chat_id, text: fid + ' Statistics failed：' + err.message })
          } finally {
            delete counting[fid]
          }
        } else if (text.startsWith('/copy')) {
          let target = text.replace('/copy', '').replace(' -u', '').trim().split(' ').map(v => v.trim())[1]
          target = get_target_by_alias(target) || target
          if (target && !validate_fid(target)) return sm({ chat_id, text: `Goal ID ${target} Malformed` })
          const update = text.endsWith(' -u')
          tg_copy({ fid, target, chat_id, update }).then(task_id => {
            task_id && sm({ chat_id, text: `Start copying，Task ID: ${task_id}Can be entered /task ${task_id} Query progress` })
          })
        } else if (text.startsWith('/task')) {
          let task_id = text.replace('/task', '').trim()
          if (task_id === 'all') {
            return send_all_tasks(chat_id)
          } else if (task_id === 'clear') {
            return clear_tasks(chat_id)
          } else if (task_id === '-h') {
            return send_task_help(chat_id)
          } else if (task_id.startsWith('rm')) {
            task_id = task_id.replace('rm', '')
            task_id = parseInt(task_id)
            if (!task_id) return send_task_help(chat_id)
            return rm_task({ task_id, chat_id })
          }
          task_id = parseInt(task_id)
          if (!task_id) {
            const running_tasks = db.prepare('select id from task where status=?').all('copying')
            if (!running_tasks.length) return sm({ chat_id, text: 'There are currently no running tasks' })
            return running_tasks.forEach(v => send_task_info({ chat_id, task_id: v.id }).catch(console.error))
          }
          send_task_info({ task_id, chat_id }).catch(console.error)
        } else if (text.includes('drive.google.com/') || validate_fid(text)) {
            return send_choice({ fid: fid || text, chat_id }).catch(console.error)
            // let replyMarkup = bot.inlineKeyboard([
            //     [
            //         bot.inlineButton('File statistics', {callback: `count ${fid}` }),
            //         bot.inlineButton('Start copying', {callback: `copy ${fid}` })
            //     ].concat(gen_bookmark_choices(fid))
            // ]);
            // return bot.sendMessage(id, `Identify the share ID ${fid}，Please select an action`, {replyMarkup});
        } else {
            is_shell = true
            // sm({ chat_id, text: 'This command is currently not supported' })
        }

    if (is_shell) {
        console.log('run shell')
        msg.reply.text('$:   '+msg.text);
        const shell = spawn(words[0],args).on('error', function( err ){
            msg.reply.text('error while executing:'+words[0]);
            msg.reply.text(err);
        });

        if(shell){

           shell.stdout.on('data', (data) => {
            msg.reply.text(`stdout:\n ${data}`);
           });

           shell.stderr.on('data', (data) => {
            msg.reply.text(`stderr: ${data}`);
           });

           shell.on('close', (code) => {
            msg.reply.text(`shell exited with code ${code}`);
           });
    }
    }
});


// Inline button callback
bot.on('callbackQuery', msg => {
    // User message alert
    if (msg) {
    const { id, data } = msg
    const chat_id = msg.from.id
    //let [action, fid] = String(data).split(' ')
    const [action, fid, target] = data.split(' ')
    //console.log("id:"+id);
    //console.log("chat_id:"+chat_id);
    // console.log("data:"+data);
    // console.log("action:"+action);console.log("fid:"+fid);
    if (action === 'count') {
      if (counting[fid]) return sm({ chat_id, text: fid + ' Statistics, please wait a moment' })
      counting[fid] = true
      send_count({ fid, chat_id }).catch(err => {
        console.error(err)
        sm({ chat_id, text: fid + ' Statistics failed：' + err.message })
      }).finally(() => {
        delete counting[fid]
      })
    } else if (action === 'copy') {
      console.log("copy id:"+id);
      if (COPYING_FIDS[fid]) return sm({ chat_id, text: `Processing ${fid} Copy command` })
      COPYING_FIDS[fid] = true
      tg_copy({ fid, target: get_target_by_alias(target), chat_id }).then(task_id => {
        task_id && sm({ chat_id, text: `Start copying, task ID: ${task_id} Can be entered /task ${task_id} Query progress` })
      }).finally(() => COPYING_FIDS[fid] = false)
    }
    return reply_cb_query({ id, data }).catch(console.error)

  }

    return bot.answerCallbackQuery(msg.id, `Inline button callback: ${ msg.data }`, true);
});

bot.start();
