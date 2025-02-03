const express = require('express');
const app = express();
app.use(express.json()); 
const cors = require('cors');
app.use(cors());
const authRoutes = require('./routes/auth'); 
const salonRoutes = require('./routes/salon');
const salonCategory = require('./routes/service_category');

app.use('/api', authRoutes); 
app.use('/api', salonRoutes);
app.use('/api', salonCategory);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
