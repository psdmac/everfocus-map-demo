//轉換功能程式引用自ola的家
//http://wangshifuola.blogspot.tw/2010/08/twd97wgs84-wgs84twd97.html

function Cal_TWD97_To_lonlat(x, y)
{
  var a = 6378137.0;
  var b = 6356752.314245;
  var lon0 = 121 * Math.PI / 180;
  var k0 = 0.9999;
  var dx = 250000;
  //
  var dy = 0;
  var e = Math.pow((1 - Math.pow(b, 2) / Math.pow(a, 2)), 0.5);

  x -= dx;
  y -= dy;

  // Calculate the Meridional Arc
  var M = y / k0;

  // Calculate Footprint Latitude
  var mu = M / (a * (1.0 - Math.pow(e, 2) / 4.0 - 3 * Math.pow(e, 4) / 64.0 - 5 * Math.pow(e, 6) / 256.0));
  var e1 = (1.0 - Math.pow((1.0 - Math.pow(e, 2)), 0.5)) / (1.0 + Math.pow((1.0 - Math.pow(e, 2)), 0.5));

  var J1 = (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32.0);
  var J2 = (21 * Math.pow(e1, 2) / 16 - 55 * Math.pow(e1, 4) / 32.0);
  var J3 = (151 * Math.pow(e1, 3) / 96.0);
  var J4 = (1097 * Math.pow(e1, 4) / 512.0);

  var fp = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);

  // Calculate Latitude and Longitude

  var e2 = Math.pow((e * a / b), 2);
  var C1 = Math.pow(e2 * Math.cos(fp), 2);
  var T1 = Math.pow(Math.tan(fp), 2);
  var R1 = a * (1 - Math.pow(e, 2)) / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(fp), 2)), (3.0 / 2.0));
  var N1 = a / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(fp), 2)), 0.5);

  var D = x / (N1 * k0);

  // 計算緯度
  var Q1 = N1 * Math.tan(fp) / R1;
  var Q2 = (Math.pow(D, 2) / 2.0);
  var Q3 = (5 + 3 * T1 + 10 * C1 - 4 * Math.pow(C1, 2) - 9 * e2) * Math.pow(D, 4) / 24.0;
  var Q4 = (61 + 90 * T1 + 298 * C1 + 45 * Math.pow(T1, 2) - 3 * Math.pow(C1, 2) - 252 * e2) * Math.pow(D, 6) / 720.0;
  var lat = fp - Q1 * (Q2 - Q3 + Q4);

  // 計算經度
  var Q5 = D;
  var Q6 = (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6;
  var Q7 = (5 - 2 * C1 + 28 * T1 - 3 * Math.pow(C1, 2) + 8 * e2 + 24 * Math.pow(T1, 2)) * Math.pow(D, 5) / 120.0;
  var lon = lon0 + (Q5 - Q6 + Q7) / Math.cos(fp);

  lat = (lat * 180) / Math.PI; //緯
  lon = (lon * 180) / Math.PI; //經

  var lonlat = lon + "," + lat;
  return lonlat;
}