Install ssl on local machiene 

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/node-selfsigned.key -out /etc/ssl/certs/node-selfsigned.crt

sudo npm start 


