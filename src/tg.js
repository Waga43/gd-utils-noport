const Table = require('cli-table3')
const dayjs = require('dayjs')
const axios = require('@viegg/axios')
const HttpsProxyAgent = require('https-proxy-agent')

const { db } = require('../db')
const { gen_count_body, validate_fid, real_copy, get_name_by_id } = require('./gd')
const { AUTH, DEFAULT_TARGET, USE_PERSONAL_AUTH } = require('../config')
const { tg_token } = AUTH
const gen_link = (fid, text) => `<a href="https://drive.google.com/drive/folders/${fid}">${text || fid}</a>`

if (!tg_token) throw new Error('Please set tg_token in config.js first')
const { https_proxy } = process.env
const axins = axios.create(https_proxy ? { httpsAgent: new HttpsProxyAgent(https_proxy) } : {})

const FID_TO_NAME = {}

async function get_folder_name (fid) {
  let name = FID_TO_NAME[fid]
  if (name) return name
  name = await get_name_by_id(fid)
  return FID_TO_NAME[fid] = name
}

function send_help (chat_id) {
  const text = `<pre>[Using help]
Command ｜ Description
=====================
/help | Back to this article
=====================
/count shareID [-u] | Return sourceID file statistics
sourceID can be the google drive sharing URL itself or the sharing ID. If -u is added at the end of the command, the previous record is ignored and forced to be obtained online, which is suitable for sharing links that have been updated after a while.
=====================
/copy sourceID targetID [-u] | Copy the sourceID file to targetID (will create a new folder)
If targetID is not filled, it will be copied to the default location (set in config.js)
If bookmark is set, then targetID can be an alias of bookmark.
If -u is added at the end of the command, the local folder is ignored to force the source folder information to be obtained online.
After the command starts to execute, it will reply to the taskID of this task.
=====================
/task | Returns the progress information of the corresponding task
example：
/task | Return details of all running tasks
/task 7 | Return task number 7
/task all | Return to list of all task records
/task clear | Clear all task records whose status is completed
/task rm 7 | Delete task record number 7
=====================
/bm [action] [alias] [target] | bookmark，Add common destination folder ID
It will appear under the two buttons of "File Statistics" and "Start Copy" after returning to the URL, which is convenient for copying to the commonly used location.
example：
/bm | Return to all set favorites
/bm set movie folder-id | Add folder-id to favorites, set the alias to movie
/bm unset movie | Delete this favorite
</pre>`
  return sm({ chat_id, text, parse_mode: 'HTML' })
}

function send_bm_help (chat_id) {
  const text = `<pre>/bm [action] [alias] [target] | bookmark，Add common destination folder ID
It will appear under the two buttons of "File Statistics" and "Start Copy" after returning to the URL, which is convenient for copying to the commonly used location.
example：
/bm | Return to all set favorites
/bm set movie folder-id | Add folder-id to favorites, set the alias to movie
/bm unset movie | Delete this favorite
</pre>`
  return sm({ chat_id, text, parse_mode: 'HTML' })
}

function send_task_help (chat_id) {
  const text = `<pre>/task [action/id] [id] | Query or manage task progress
example：
/task | Return details of all running tasks
/task 7 | Return task number 7
/task all | Return to list of all task records
/task clear | Clear all task records whose status is completed
/task rm 7 | Delete task record number 7
</pre>`
  return sm({ chat_id, text, parse_mode: 'HTML' })
}

function clear_tasks (chat_id) {
  const finished_tasks = db.prepare('select id from task where status=?').all('finished')
  finished_tasks.forEach(task => rm_task({ task_id: task.id }))
  sm({ chat_id, text: '已清除所有状态为已完成的任务记录' })
}

function rm_task ({ task_id, chat_id }) {
  const exist = db.prepare('select id from task where id=?').get(task_id)
  if (!exist) return sm({ chat_id, text: `No task record with the number ${task_id}` })
  db.prepare('delete from task where id=?').run(task_id)
  db.prepare('delete from copied where taskid=?').run(task_id)
  if (chat_id) sm({ chat_id, text: `Deleted task ${task_id} record` })
}

function send_all_bookmarks (chat_id) {
  let records = db.prepare('select alias, target from bookmark').all()
  if (!records.length) return sm({ chat_id, text: 'There is no favorite record in the database' })
  const tb = new Table({ style: { head: [], border: [] } })
  const headers = ['Alias','Directory ID']
  records = records.map(v => [v.alias, v.target])
  tb.push(headers, ...records)
  const text = tb.toString().replace(/─/g, '—')
  return sm({ chat_id, text: `<pre>${text}</pre>`, parse_mode: 'HTML' })
}

function set_bookmark ({ chat_id, alias, target }) {
  const record = db.prepare('select alias from bookmark where alias=?').get(alias)
  if (record) return sm({ chat_id, text: 'A collection with the same name already exists in the database' })
  db.prepare('INSERT INTO bookmark (alias, target) VALUES (?, ?)').run(alias, target)
  return sm({ chat_id, text: `Successfully set favorites：${alias} | ${target}` })
}

function unset_bookmark ({ chat_id, alias }) {
  const record = db.prepare('select alias from bookmark where alias=?').get(alias)
  if (!record) return sm({ chat_id, text: 'No favorites found for this alias' })
  db.prepare('delete from bookmark where alias=?').run(alias)
  return sm({ chat_id, text: 'Successfully deleted favorites ' + alias })
}

function get_target_by_alias (alias) {
  const record = db.prepare('select target from bookmark where alias=?').get(alias)
  return record && record.target
}

function get_alias_by_target (target) {
  const record = db.prepare('select alias from bookmark where target=?').get(target)
  return record && record.alias
}

function send_choice ({ fid, chat_id }) {
  return sm({
    chat_id,
    text: `Recognizing the share ID ${fid}, please select an action`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'File statistics', callback_data: `count ${fid}` },
          { text: 'Start copying', callback_data: `copy ${fid}` }
        ]
      ].concat(gen_bookmark_choices(fid))
    }
  })
}

console.log(gen_bookmark_choices())
function gen_bookmark_choices (fid) {
  console.log("gen_bookmark_choices: " + fid)
  const gen_choice = v => ({ text: `Copy to ${v.alias}`, callback_data: `copy ${fid} ${v.alias}` })
  const records = db.prepare('select * from bookmark').all()
  const result = []
  for (let i = 0; i < records.length; i += 2) {
    const line = [gen_choice(records[i])]
    if (records[i + 1]) line.push(gen_choice(records[i + 1]))
    result.push(line)
  }
  return result
}

async function send_all_tasks (chat_id) {
  let records = db.prepare('select id, status, ctime from task').all()
  if (!records.length) return sm({ chat_id, text: 'There is no task record in the database' })
  const tb = new Table({ style: { head: [], border: [] } })
  const headers = ['ID', 'status', 'ctime']
  records = records.map(v => {
    const { id, status, ctime } = v
    return [id, status, dayjs(ctime).format('YYYY-MM-DD HH:mm:ss')]
  })
  tb.push(headers, ...records)
  const text = tb.toString().replace(/─/g, '—')
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  return axins.post(url, {
    chat_id,
    parse_mode: 'HTML',
    text: `All copy tasks：\n<pre>${text}</pre>`
  }).catch(err => {
    // const description = err.response && err.response.data && err.response.data.description
    // if (description && description.includes('message is too long')) {
    if (true) {
      const text = [headers].concat(records).map(v => v.join('\t')).join('\n')
      return sm({ chat_id, parse_mode: 'HTML', text: `All copy tasks：\n<pre>${text}</pre>` })
    }
    console.error(err)
  })
}

async function get_task_info (task_id) {
  const record = db.prepare('select * from task where id=?').get(task_id)
  if (!record) return {}
  const { source, target, status, mapping, ctime, ftime } = record
  const { copied_files } = db.prepare('select count(fileid) as copied_files from copied where taskid=?').get(task_id)
  const folder_mapping = mapping && mapping.trim().split('\n')
  const new_folder = folder_mapping && folder_mapping[0].split(' ')[1]
  const { summary } = db.prepare('select summary from gd where fid=?').get(source) || {}
  const { file_count, folder_count, total_size } = summary ? JSON.parse(summary) : {}
  const total_count = (file_count || 0) + (folder_count || 0)
  const copied_folders = folder_mapping ? (folder_mapping.length - 1) : 0
  let text = 'Task number：' + task_id + '\n'
  const folder_name = await get_folder_name(source)
  text += 'Source folder：' + gen_link(source, folder_name) + '\n'
  text += 'Destination location：' + gen_link(target, get_alias_by_target(target)) + '\n'
  text += 'New folder：' + (new_folder ? gen_link(new_folder) : 'Not created yet') + '\n'
  text += 'Task status：' + status + '\n'
  text += 'Creation time：' + dayjs(ctime).format('YYYY-MM-DD HH:mm:ss') + '\n'
  text += 'Complete time：' + (ftime ? dayjs(ftime).format('YYYY-MM-DD HH:mm:ss') : 'unfinished') + '\n'
  text += 'Directory progress：' + copied_folders + '/' + (folder_count === undefined ? 'Unknown quantity' : folder_count) + '\n'
  text += 'File progress：' + copied_files + '/' + (file_count === undefined ? 'Unknown quantity' : file_count) + '\n'
  text += 'Total percentage：' + ((copied_files + copied_folders) * 100 / total_count).toFixed(2) + '%\n'
  text += '合计大小：' + (total_size || 'Unknown size')
  return { text, status, folder_count }
}

async function send_task_info ({ task_id, chat_id }) {
  const { text, status, folder_count } = await get_task_info(task_id)
  if (!text) return sm({ chat_id, text: 'This task ID does not exist in the database：' + task_id })
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  let message_id
  try {
    const { data } = await axins.post(url, { chat_id, text, parse_mode: 'HTML' })
    message_id = data && data.result && data.result.message_id
  } catch (e) {
    console.log('fail to send message to tg', e.message)
  }
  // get_task_info eats CPUs when the number of task directories is too large, if it is better to save mapping in a future table
  if (!message_id || status !== 'copying') return
  const loop = setInterval(async () => {
    const url = `https://api.telegram.org/bot${tg_token}/editMessageText`
    const { text, status } = await get_task_info(task_id)
    if (status !== 'copying') clearInterval(loop)
    axins.post(url, { chat_id, message_id, text, parse_mode: 'HTML' }).catch(e => console.error(e.message))
  }, 10 * 1000)
}

async function tg_copy ({ fid, target, chat_id, update }) { // return task_id
  target = target || DEFAULT_TARGET
  if (!target) {
    sm({ chat_id, text: 'Please enter the destination ID or set the default copy destination ID in config.js (DEFAULT_TARGET)' })
    return
  }

  let record = db.prepare('select id, status from task where source=? and target=?').get(fid, target)
  if (record) {
    if (record.status === 'copying') {
      sm({ chat_id, text: 'A task with the same source ID and destination ID is already in progress, and the query progress can be entered /task ' + record.id })
      return
    } else if (record.status === 'finished') {
      sm({ chat_id, text: `Detected an existing task ${record.id}，Start copying` })
    }
  }

  real_copy({ source: fid, update, target, service_account: !USE_PERSONAL_AUTH, is_server: true })
    .then(async info => {
      if (!record) record = {} // Prevent infinite loop
      if (!info) return
      const { task_id } = info
      const { text } = await get_task_info(task_id)
      sm({ chat_id, text, parse_mode: 'HTML' })
    })
    .catch(err => {
      const task_id = record && record.id
      if (task_id) db.prepare('update task set status=? where id=?').run('error', task_id)
      if (!record) record = {}
      console.error('Copy failed', fid, '-->', target)
      console.error(err)
      sm({ chat_id, text: 'Copy failed, failed message：' + err.message })
    })

  while (!record) {
    record = db.prepare('select id from task where source=? and target=?').get(fid, target)
    await sleep(1000)
  }
  return record.id
}

function sleep (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

function reply_cb_query ({ id, data }) {
  const url = `https://api.telegram.org/bot${tg_token}/answerCallbackQuery`
  return axins.post(url, {
    callback_query_id: id,
    text: 'Begin execution ' + data
  })
}

async function send_count ({ fid, chat_id, update }) {
  sm({ chat_id, text: `Start to get all the file information of ${fid}, please wait a while` })
  const table = await gen_count_body({ fid, update, type: 'tg', service_account: !USE_PERSONAL_AUTH })
  if (!table) return sm({ chat_id, parse_mode: 'HTML', text: gen_link(fid) + ' Information acquisition failed' })
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  const gd_link = `https://drive.google.com/drive/folders/${fid}`
  const name = await get_folder_name(fid)
  return axins.post(url, {
    chat_id,
    parse_mode: 'HTML',
    text: `<pre>Source folder name：${name}
Source link：${gd_link}
${table}</pre>`
  }).catch(async err => {
    // const description = err.response && err.response.data && err.response.data.description
    // const too_long_msgs = ['request entity too large', 'message is too long']
    // if (description && too_long_msgs.some(v => description.toLowerCase().includes(v))) {
    if (true) {
      const smy = await gen_count_body({ fid, type: 'json', service_account: !USE_PERSONAL_AUTH })
      const { file_count, folder_count, total_size } = JSON.parse(smy)
      return sm({
        chat_id,
        parse_mode: 'HTML',
        text: `link：<a href="https://drive.google.com/drive/folders/${fid}">${fid}</a>\n<pre>
The form is too long to exceed the telegram message limit, only the summary is displayed：
Directory name：${name}
Total files：${file_count}
Total number of directories：${folder_count}
Total size：${total_size}
</pre>`
      })
    }
    throw err
  })
}

function sm (data) {
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  return axins.post(url, data).catch(err => {
    // console.error('fail to post', url, data)
    console.error('fail to send message to tg:', err.message)
  })
}

function extract_fid (text) {
  text = text.replace(/^\/count/, '').replace(/^\/copy/, '').replace(/\\/g, '').trim()
  const [source, target] = text.split(' ').map(v => v.trim())
  if (validate_fid(source)) return source
  try {
    if (!text.startsWith('http')) text = 'https://' + text
    const u = new URL(text)
    if (u.pathname.includes('/folders/')) {
      const reg = /[^/?]+$/
      const match = u.pathname.match(reg)
      return match && match[0]
    }
    return u.searchParams.get('id')
  } catch (e) {
    return ''
  }
}

function extract_from_text (text) {
  const reg = /https?:\/\/drive.google.com\/[^\s]+/g
  const m = text.match(reg)
  return m && extract_fid(m[0])
}

module.exports = { send_count, send_help, sm, extract_fid, reply_cb_query, send_choice, send_task_info, send_all_tasks, tg_copy, extract_from_text, get_target_by_alias, send_bm_help, gen_bookmark_choices, send_all_bookmarks, set_bookmark, unset_bookmark, clear_tasks, send_task_help, rm_task }
