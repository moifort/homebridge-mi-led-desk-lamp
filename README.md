# homebridge-mi-led-desk-lamp

This is a [Homebridge](https://github.com/nfarina/homebridge) plugin for exposing the Xiaomi Led Desk Lamp to HomeKit

![mi](https://ae01.alicdn.com/kf/HTB1_8Uya7fb_uJkSne1q6zE4XXan/Original-Xiaomi-Mijia-LED-Desk-Lamp-Smart-Table-Lamps-Desklight-Support-Mobile-Phone-App-Control-4.jpg_640x640.jpg)

## Get your token and IP

Good luck!!! (Because it's the hard part), some links to help you:

* https://github.com/jghaanstra/com.xiaomi-miio/blob/master/docs/obtain_token.md
* https://github.com/mediter/miio/blob/master/docs/ios-token-without-reset.md

### npm

```
npm install -g homebridge-mi-led-desk-lamp
```


## Example Configuration

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "Thibaut",
    "port": 51826,
    "pin": "111-11-111"
  },
  "accessories": [
    {
    "accessory": "mi-led-desk-lamp",
    "name": "My desk lamp",
    "ip": "192.168.0.132",
    "token": "6591d0ad2003ddd2da75815f5d7def26"
    }
  ],
  "platforms": []
}
``` 
