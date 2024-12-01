cd /home/ec2-user/myapp || exit

pm2 stop index.js || true  
pm2 start index.js       
pm2 save