import express from "express";
import cors from "cors"
import vehicleRoute from './routes/vehicle'
import claimRoute  from './routes/claim'
import customerRoute from './routes/customer'
import insurerRoute from './routes/insurer'
import lineWebhookRoute from './routes/webhook'
const app = express()

app.use(express())
app.use(cors())
app.use(lineWebhookRoute)
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.use('/api/v1',vehicleRoute)
app.use('/api/v1',claimRoute)
app.use('/api/v1',customerRoute)
app.use('/api/v1',insurerRoute)

app.listen(3000,()=> {
    console.log("currently listion on port 3000")
})
