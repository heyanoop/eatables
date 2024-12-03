cd /home/ec2-user/eatables

pm2 stop index.js
pm2 start index.js       
pm2 save