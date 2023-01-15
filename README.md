# シリアル通信画像表示アプリ

シリアル通信を通して spresense のカメラに映った画像と電源電圧のデータを受信するプログラム

UI 部分は react、デスクトップで動かすために electron、シリアル通信で node-serialport を使っている。

通信相手の spresense プログラムは
https://github.com/tannakaken/searchSatellite
にある。

## 環境構築

https://zenn.dev/sprout2000/articles/5d7b350c2e85bc を参考にして electron の環境構築
