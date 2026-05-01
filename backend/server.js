const express = require('express')

const app = express()

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use('/api/resolve', require('./routes/resolve'))
app.use('/api/allocation', require('./routes/allocation'))
app.use('/api/activity', require('./routes/activity'))
app.use('/api/featured', require('./routes/featured'))
app.use('/api/participant', require('./routes/participant'))

if (require.main === module) {
  const port = process.env.BACKEND_PORT || 3001
  app.listen(port, () => console.log(`Server listening on port ${port}`))
}

module.exports = app
