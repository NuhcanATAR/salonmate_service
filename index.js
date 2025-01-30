const express = require('express');
const app = express();
app.use(express.json()); 
const cors = require('cors');
app.use(cors());
const authRoutes = require('./routes/auth'); 

app.use('/api', authRoutes); 

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
