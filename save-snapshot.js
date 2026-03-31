import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const markdown = fs.readFileSync('./axa-snapshot.md', 'utf8')

const { data, error } = await supabase
  .from('snapshots')
  .insert({
    competitor_id: '6a9b66b9-c62c-43d6-b20f-dd3f25dd3595',
    url:           'https://www.axa.ch/en/private-customers.html',
    captured_at:   new Date().toISOString(),
    content_md:    markdown
  })

if (error) console.error('❌ Error:', error)
else console.log('✅ Snapshot saved!')
