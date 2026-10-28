// Live changelog via Supabase Realtime. The page loads existing entries once,
// then subscribes to postgres_changes (INSERT) on the changelog table — so a
// new row inserted anywhere (SQL, dashboard, an admin tool) appears here
// instantly with NO page reload and NO redeploy. That's the whole point of
// the puzzle: content updates decoupled from deploys.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://qqncjqapqaubbbnkzhjb.supabase.co'
// Publishable/anon key — safe to ship to the client. RLS allows read-only.
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbmNqcWFwcWF1YmJibmt6aGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTIyMDksImV4cCI6MjA5MzM4ODIwOX0.ZTSlyALClHBUbVWW2G8zMB6fgyDuPCrgyU4n5HM1JyM'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

const list = document.getElementById('list')
const dot = document.getElementById('dot')
const statusText = document.getElementById('status-text')

function fmtTime(ts) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function renderEntry(row, isNew) {
  const el = document.createElement('div')
  el.className = 'entry' + (isNew ? ' flash' : '')
  el.dataset.id = row.id
  const type = ['feature', 'fix', 'improvement'].includes(row.entry_type) ? row.entry_type : 'feature'
  // Static skeleton only (type is whitelisted above); every DB-sourced value
  // is injected via textContent so no field can inject markup, even though
  // writes are admin/service-role only.
  el.innerHTML = `
    <div class="entry-head">
      <span class="ver"></span>
      <span class="tag ${type}">${type}</span>
    </div>
    <h2></h2>
    <p></p>
    <div class="time"></div>`
  el.querySelector('.ver').textContent = row.version
  el.querySelector('h2').textContent = row.title
  el.querySelector('p').textContent = row.body
  el.querySelector('.time').textContent = fmtTime(row.created_at)
  return el
}

async function loadInitial() {
  const { data, error } = await supabase
    .from('puzzle40_changelog')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    statusText.textContent = 'load error: ' + error.message
    return
  }
  list.innerHTML = ''
  for (const row of data) list.appendChild(renderEntry(row, false))
}

function subscribe() {
  supabase
    .channel('puzzle40-changelog')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'puzzle40_changelog' },
      (payload) => {
        // Prepend the newly inserted row live, with a flash highlight.
        const el = renderEntry(payload.new, true)
        list.insertBefore(el, list.firstChild)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        dot.classList.add('live')
        statusText.textContent = 'live — subscribed to realtime updates'
      } else {
        dot.classList.remove('live')
        statusText.textContent = 'realtime: ' + status.toLowerCase()
      }
    })
}

await loadInitial()
subscribe()
