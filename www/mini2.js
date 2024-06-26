let info, datatime;
let timelist = [];
let buslisted, rate;
let nexttimed, pretimed, nexttime, pretime

function addMinutesToTime(time, minutesToAdd) { // 時刻に分を加算
  var parts = time.split(":");
  var hours = parseInt(parts[0]);
  var minutes = parseInt(parts[1]);
  hours += Math.floor((minutes + minutesToAdd) / 60);
  minutes = (minutes + minutesToAdd) % 60;
  hours = (hours < 10 ? "0" : "") + hours;
  minutes = (minutes < 10 ? "0" : "") + minutes;
  return hours + ":" + minutes;
}

function show_popup(fontcolor, bgcolor, text, faicon,timer) { // ポップアップを表示する
  document.getElementById("popup").style.display = null;
  document.getElementById("popup").style.background = bgcolor;
  document.getElementById("popclose").style.color = fontcolor;
  document.getElementById("popicon").style.color = fontcolor;
  document.getElementById("poptext").style.color = fontcolor;
  document.getElementById("poptext").innerHTML = text;
  document.getElementById("popicon").setAttribute("class", faicon);
  if (timer!==true&&timer!==false) {
    setTimeout(() => {
      document.getElementById('popup').style.display = 'none';
    }, timer*1000);
  }
  if (timer===false) {
    document.getElementById("popclose").style.display = 'none';
  } else {
    document.getElementById("popclose").style.display = null;

  }
}

function averageUnixTime(unixTimes) { // UNIX時間の合計を計算
  if (unixTimes.length === 0) {
    return null;
  }
  const sumUnixTime = unixTimes.reduce((total, unixTime) => total + unixTime, 0);
  const averageUnixTime = sumUnixTime / unixTimes.length;
  return averageUnixTime;
}

function formatTime() { // 計算済みの平均時刻を日本の形式にして表示する
  let unix = averageUnixTime(timelist);
  if (unix) {
    const now = new Date(unix * 1000);
    var year = now.getFullYear();
    var month = pad(now.getMonth() + 1); // 月は0から始まるため、+1する
    var day = pad(now.getDate());
    var days = ['日', '月', '火', '水', '木', '金', '土'];
    var dayOfWeek = days[now.getDay()];
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    function pad(num) {
      return (num < 10 ? '0' : '') + num;
    }
    document.getElementById("tit").innerHTML = year + '年' + month + '月' + day + '日(' + dayOfWeek + ')';
    document.getElementById("time").innerHTML = hours + ':' + pad(minutes) + ':' + pad(seconds);
  }
}
let map;
let popupTimeout;

function openPopup() {
  if (!popupTimeout) {
    popupTimeout = setTimeout(() => {
      // console.log(this);
      this.openPopup();
      document.getElementById("timetable").style.display = null;

      popupTimeout = null;
    }, 175);
  }
}

function closePopup() {
  if (!popupTimeout) {
    popupTimeout = setTimeout(() => {
      this.closePopup();
      popupTimeout = null;
    }, 175);
  }
}
let loc = "";
let lat, lon;
// 津軽線　　　#15a2c4
// 青い森鉄道　#33cbf4
// 奥羽本線　　#ee7b28
let SUGGEST_LIST = [];
const Utility = {
  // 特殊文字エスケープ
  escapeHtml(str) {
    if (typeof str !== 'string') {
      return str;
    }
    const map = {
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27',
      '`': '&#x60',
      '<': '&lt;',
      '>': '&gt;',
    };
    return str.replace(/[&<>"'`]/g, char => map[char]);
  }
};
// 緯度と経度から距離を計算する関数を追加
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
let dic = [];
fetch('bus_lines.json').then(response => response.json()).then(data => {
  dic = [...data];
}).catch(error => {
  show_popup("#fff", "#ef665b", "情報の収集に失敗しました。", "fa-solid fa-circle-exclamation",5);
});
// グラデーションを持つCircleMarkerを描画する関数
function createGradientCircleMarker(latlng, radius) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  var gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  gradient.addColorStop(0, 'rgba(255, 208, 117, 1)'); // 外側の色
  gradient.addColorStop(1, 'rgba(255, 208, 117, 0)'); // 内側の透明な色

  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
  ctx.fillStyle = gradient;
  ctx.fill();

  var base64 = canvas.toDataURL(); // Canvasを画像データURLに変換

  return L.marker(latlng, {
    icon: L.icon({
      iconUrl: base64,
      iconSize: [radius * 2, radius * 2],
      iconAnchor: [radius, radius]
    })
  });
}

function currentWatch() {
  function success(pos) {
    console.log(pos);
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    document.getElementById("time").innerHTML = `${Math.round(pos.coords.speed*10)/10}km/h`;
    // 現在地に表示するマーカー
    if (curMarker) {
      map.removeLayer(curMarker);
    } else {
      map.setView([lat, lng], 16);
    }
    var curIcon = L.icon({
      /* アイコン */
      iconUrl: 'icons/hiking.png',
      iconRetinaUrl: 'icons/hiking.png',
      iconAnchor: [15, 34]
    });
    curMarker = L.marker([lat, lng], {
      icon: curIcon
    }).addTo(map);
  }

  function error(err) {
    show_popup("#fff", "#ef665b", "位置情報を取得できませんでした。", "fa-solid fa-circle-exclamation",5);
  }
  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };
  if (watch_id == 0) {
    watch_id = navigator.geolocation.watchPosition(success, error, options); // 現在地情報を定期的に
  }
}

function currentWatchReset() {
  if (watch_id > 0) {
    navigator.geolocation.clearWatch(watch_id);
    watch_id = 0;
  }
  if (curMarker) {
    map.removeLayer(curMarker);
    curMarker = null;
  }
  const isMobileDevice = /Mobi/i.test(navigator.userAgent);
  // PC版の設定
  if (isMobileDevice === false) {
    map.setView([40.853600, 140.748041], 13);
  } else {
    map.setView([40.853600, 140.748041], 12);
  }
}
var watch_id = 0;
var curMarker = null; // 現在地マーカー
var currentWatchBtn = null;
var currentFullBtn = null;
let marker;
let first_done = false;
async function makemap(lat, lon, zoom, flag) {
  const BusIcon = L.icon({
    iconUrl: ['icons/busstop.png'], // 画像ファイルパス
    iconSize: [15, 42] // アイコンサイズ
  });
  map = L.map('map'); // 'map' に表示する地図を変数 map で指定
  map.zoomControl.setPosition('topright');
  var google = L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    attribution: "<a href='https://aomoricitybus.com/buslocation/' target='_blank'>青ロケ マップ</a>｜<a href='https://developers.google.com/maps/documentation' target='_blank'>Google Map</a>｜<a href='https://nucbox5.dorper-royal.ts.net/' target='_blank'>Toki's system</a>"
  });
  var osm = L.tileLayer('http://tile.openstreetmap.jp/{z}/{x}/{y}.png', {
    attribution: "<a href='https://aomoricitybus.com/buslocation/' target='_blank'>青ロケ マップ</a>｜<a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a>｜<a href='https://nucbox5.dorper-royal.ts.net/' target='_blank'>Toki's system</a>"
  });
  google.addTo(map);
  // 現在地表示ボタン
  L.easyButton({ // 現在地表示ボタン
    states: [{
      stateName: 'current-watch',
      icon: 'fas fa-map-marker-alt',
      title: '現在地',
      onClick: function(btn, map) {
        currentWatch();
        btn.state('current-watch-reset');
        currentWatchBtn = btn;
      }
    }, {
      stateName: 'current-watch-reset',
      icon: 'fa fa-user',
      title: '現在地オフ',
      onClick: function(btn, map) {
        currentWatchReset();
        btn.state('current-watch');
      }
    }]
  }).setPosition('topright').addTo(map);

  L.easyButton({ // 現在地表示ボタン
    states: [{
      stateName: 'current-full',
      icon: 'fa-solid fa-maximize',
      title: 'フルスクリーンモードにする',
      onClick: function(btn, map) {
        document.body.requestFullscreen();		
        btn.state('current-full-reset');
        currentFullBtn = btn;
      }
    }, {
      stateName: 'current-full-reset',
      icon: 'fa-solid fa-minimize',
      title: 'フルスクリーンモードを解除',
      onClick: function(btn, map) {
        document.exitFullscreen();
        btn.state('current-full');
      }
    }]
  }).setPosition('topright').addTo(map);
  // var option = {
  //   position: 'topright'
  // }
  // map.addControl( new L.Control.Compass(option) );
  if (flag === true) {
    marker = L.marker([lat, lon]).addTo(map); // マップにピンを立てる
  }
  if (first_done == false) {
    const isMobileDevice = /Mobi/i.test(navigator.userAgent);
    // PC版の設定
    if (isMobileDevice === false) {
      map.setView([40.853600, 140.748041], 13);
    } else {
      map.setView([40.853600, 140.748041], 12);
    }
  }

  let busmarker = L.layerGroup();
  let busstop = L.layerGroup();
  let busline = L.layerGroup();
  L.control.scale({
    imperial: false
  }).addTo(map);
  var gpx = 'aobus.gpx';
  new L.GPX(gpx, {
    async: true,
    marker_options: {
      startIconUrl: '', // マーカーを非表示にするために空の文字列を設定
      endIconUrl: '', // マーカーを非表示にするために空の文字列を設定
      shadowUrl: false,
      iconSize: [20, 30],
      iconAnchor: [16, 30]
    },
    polyline_options: {
      color: '#16cd96',
      opacity: 0.8,
      weight: 3,
      lineCap: 'round'
    }
  }).on('loaded', function(e) {
    busline.addLayer(e.target);
    busline.addTo(map); //.snakeIn();
  }).on('addline', function(e) {
    const match = e.element.childNodes[0].nextElementSibling.childNodes[0].data.match(/[a-zA-Z]/);
    if (match !== null) {
      const firstLetter = match[0];
      let linecolor;
      linecolor = alphabet(firstLetter);
      e.line.setStyle({
        color: linecolor
      });
    }
  });
  info = L.control();
  info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'nowtime');
    this.update();
    return this._div;
  };

  info.update = function(props) {
    this._div.innerHTML = `<h4 id="tit">Loading...</h4><output id="time">Loading...</output>`;
    this._div.style.display = "none"; /* 時計を非表示 */
  };
  info.setPosition('topleft').addTo(map);
  async function fetchBusData(markerLayer, icon) {
    return new Promise((resolve, reject) => {
      gtfsrt()
      .then(response => {
        let buslist = [];
        // let buslist = []; // サンプルを有効化
        response.entity.forEach(function(entity) {
          if (entity.vehicle) {
            //コンソールにデータを表示
            buslist.push({
              "lat": entity.vehicle.position.latitude,
              "lon": entity.vehicle.position.longitude,
              "name": entity.vehicle.trip.tripId,
              "busname": entity.vehicle.trip.tripId,
              "currentStopSequence": entity.vehicle.currentStopSequence,
              "currentStatus": entity.vehicle.currentStatus,
              "timestamp": entity.vehicle.timestamp.low,
              "licensePlate": entity.vehicle.vehicle.licensePlate
            });
            // console.log(entity.vehicle.currentStatus);
          }
        });;
        console.log(buslist);
        return buslist;
      }).then(data => {
        // console.table(data);
        if (markerLayer == "busmarker") {
          console.log("現在走行中のバス数：" + data.length);
          delelement = [];
          if (data.length == 0) {
            show_popup("#fff", "#ef665b", "現在運行中のバスはありません。", "fa-solid fa-circle-exclamation",5);
            document.getElementById("tit").innerHTML = "運行データなし";
            document.getElementById("time").innerHTML = "現在、バスはありません。";
          }
          busmarker.clearLayers();
        }
        timelist = [];
        data.forEach(async (element) => {
          let tcolor = "#fff";
          element.previous = "";
          element.next = "";
          element.licensePlated = "";
          element.timestamped = "";
          timelist.push(element.timestamp);
          color = ""
          if (element.zone_id) {
            element.num = "";
            element.road = "青森市営バス";
          }
          if (element.name) {
            element.to = element.name.replace(element.road, "");
          }
          if (element.busname) {
            datatime.forEach((dataElement) => {
              if (dataElement.busname === element.busname) {
                element.delay = dataElement.delay;
                if (dataElement.delay < 60) {
                  element.delayshow = ""; // `<output style="color:#83d6c5;" id="${dataElement.busname}">定刻</output>`;
                  rate = "";
                } else {
                  tcolor = "#df8807";
                  element.delayshow = `${Math.round(dataElement.delay / 60)}分遅れ`;
                  rate = Math.round(dataElement.delay / 60);

                  var objP1 = L.circleMarker([element.lat || element.stop_lat, element.lon || element.stop_lon], {
                    radius: 24,
                    fillColor: "#ffd075",
                    color: "#000000",
                    weight: 1,
                    opacity: 0,
                    fillOpacity: 0.4
                  });
                  busmarker.addLayer(objP1);
                }
              }
            });

            const matchedBus = buslisted.find(item => item.bus == element.busname);
            element.busnamek = `<b>系統</b>:${element.busname.match(/系統(\d+)/)[1]}`;
            element.licensePlated = `車両番号:${element.licensePlate}`;
            element.timestamped = `${unixTimeToHHMM(element.timestamp)} 更新`;
            element.matchedBus = matchedBus;
            if (element.delay < 60) {
              pretimed = `${matchedBus.stops[Math.max(element.currentStopSequence-1, 0)].arrival_time}`;
              nexttimed = `${matchedBus.stops[element.currentStopSequence].arrival_time}`;
            } else {
              pretime = matchedBus.stops[Math.max(element.currentStopSequence - 1, 0)].arrival_time;
              nexttime = matchedBus.stops[element.currentStopSequence].arrival_time;
              pretimed = `<strike>${pretime}</strike> ${addMinutesToTime(pretime,Math.round(element.delay / 60))}`;
              nexttimed = `<strike>${nexttime}</strike> ${addMinutesToTime(nexttime,Math.round(element.delay / 60))}`;
            }

            element.previous = `<b>前停留所</b>:${matchedBus.stops[Math.max(element.currentStopSequence-1, 0)].stop_name} ${pretimed}`;
            element.next = `<b>次停留所</b>:${matchedBus.stops[element.currentStopSequence].stop_name} ${nexttimed}`;
          } else {
            element.busnamek = "";
            element.delayshow = "";
          }
          const regex = /\d+$/;
          const match = element.name.match(regex);
          const lastDigit = match ? match[0] : null;
          for (let index = 0; index < dic.length; index++) {
            const dicc = dic[index];
            if (lastDigit == dicc.shape) {
              element.name = dicc.trip_headsign;
              const inputString = dicc.trip_headsign;
              const regexPattern = /^(.*?)\d+(.*?)（(.*?)）$/;
              const matches = inputString.match(regexPattern);
              if (matches) {
                const [first, station, school, line] = matches;
                element.num = ""; // "<b>路線番号</b>: "+first.replace(school,"").replace(line,"").replace("（）","");
                element.to = school.trim() + "行";
                element.road = first.replace(school, "").replace(line, "").replace("（）", "") + "　" + line.trim();
              } else {

                console.log(`マッチしませんでした。${element.name}`);
              }
            }
          }
          if (element.name !== null) {
            const match = element.name.match(/[a-zA-Z]/);
            if (match !== null) {
              const firstLetter = match[0];
              color = alphabet(firstLetter);
              if (markerLayer == "busmarker") {
                icon = L.icon({
                  iconUrl: [`icons\\bus\\${firstLetter}.png`], // 画像ファイルパス
                  iconSize: [32, 32] // アイコンサイズ
                });
              }
            } else {
              if (markerLayer == "busmarker") {
                icon = L.icon({
                  iconUrl: [`icons\\bus\\6.png`], // 画像ファイルパス
                  iconSize: [32, 32] // アイコンサイズ
                });
                color = "#000";
              }
            }
          }
          if (color) {
            element.color = color;
          }

          function unixTimeToHHMM(unixTimestamp) {
            // UNIXタイムスタンプをミリ秒に変換
            var milliseconds = unixTimestamp * 1000;
            // Dateオブジェクトを作成
            var date = new Date(milliseconds);
            var hours = date.getHours();
            var minutes = date.getMinutes();
            // 1桁の場合は0で埋める
            hours = hours < 10 ? '0' + hours : hours;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            // hh:mm形式の文字列を返す
            return hours + ':' + minutes;
          }
          const strr = element.road;
          const regexr = /[a-zA-Z]?\d{1,2}/g;
          const matches = strr.match(regexr);
          let marker = L.marker([element.lat || element.stop_lat, element.lon || element.stop_lon], {
            icon: icon
            // intentDuration: 300
          }).bindPopup(`
<table style="color:#df8807;font-family: CustomFont, sans-serif;font-size:16px;">
	<tbody>
		<tr>
			<td rowspan="2" style="zoom:2.3;">${matches[0]}</td>
			<td>${element.road.replace(matches[0],"")}</td>
		</tr>
		<tr>
			<td>${element.to}</td>
		</tr>
	</tbody><!--
  <tbody>
    <tr>
      <td rowspan="2" style="background:${element.color};width:10px;"></td>
      <td colspan="2"><b>${element.road}</b></td>
    </tr>
    <tr>
      <td colspan="2">${element.to}</td>
    </tr>
    <tr>
      <td colspan="3">${element.licensePlated}</td>
    </tr>
    <tr>
      <td colspan="3" style="color:${tcolor};">${element.previous}</td>
    </tr>
    <tr>
      <td colspan="3" style="color:${tcolor};">${element.next}</td>
    </tr>
    <tr>
      <td colspan="3" style="color:${tcolor};"><b>${element.delayshow}</b></td>
    </tr>
  </tbody>-->
</table>`).on('mouseintent', openPopup).on('mouseover', openPopup).on('mouseout', closePopup).on('popupopen', function() {
            // console.log(`ポップアップ[${this}]が開かれました。`);
            document.getElementById("timetable").style.display = null;

            let ttable = "";
            for (let index = 0; index < element.matchedBus.stops.length; index++) {
              const elemented = element.matchedBus.stops[index];

              // console.log(elemented);
              if (element.delay < 60) {
                ttable += `
      <tr id="tr_${index+1}">
      <td><span class="point" id="tri_${index+1}"></span></td>
        <!--<td style="background:${element.color};color:#fff;max-width:10px;font-size:13px;text-align: left;" id="tri_${index+1}">●</td>-->
        <td>${elemented.stop_name}</td>
        <td align="right">${elemented.arrival_time}</td>
      </tr><!--
      <tr>
        <td style="background:${element.color};width:10px;"></td>
        <td></td>
        <td>${elemented.departure_time}</td>
      </tr>-->
      `;
              } else {
                ttable += `
  <tr id="tr_${index+1}">
  <td><span class="point" id="tri_${index+1}"></span></td>

  <!--<td style="background:${element.color};color:#fff;max-width:10px;font-size:13px;text-align: left;" id="tri_${index+1}">●</td>-->
    <td>${elemented.stop_name}</td>
    <td align="right" style="color:#df8807;"><strike>${elemented.arrival_time}</strike>　　${addMinutesToTime(elemented.arrival_time,Math.round(element.delay / 60))}</td>
  </tr><!--
  <tr>
    <td style="background:${element.color};width:10px;color:#df8807;"></td>
    <td></td>
    <td>${addMinutesToTime(elemented.departure_time,Math.round(element.delay / 60))}</td>
  </tr>-->
  `;
              }
            }
ttable+= `<div class="loader3"><div class="loader2">
  <div style="--i:1" class="loader_item"></div>
  <div style="--i:2" class="loader_item"></div>
  <div style="--i:3" class="loader_item"></div>
  <div style="--i:4" class="loader_item"></div>
  <div style="--i:5" class="loader_item"></div> 
  <div style="--i:6" class="loader_item"></div>
  <div style="--i:7" class="loader_item"></div>
  <div style="--i:8" class="loader_item"></div>
  <div style="--i:9" class="loader_item"></div>
  <div style="--i:10" class="loader_item"></div>
  <div style="--i:11" class="loader_item"></div>
  <div style="--i:12" class="loader_item"></div>
</div></div>
`;
            document.getElementById("timetable").innerHTML = `
  <table id="myTable" style="width:99vw;">
  <tbody style="border-bottom: 2px solid #fff;">
      <tr>
        <td style="background:${element.color};width:10px;" rowspan="2"></td>
        <td><b>${element.road}</b>　<output style="color:#df8807">${element.delayshow}</output></td>
        <td align="right"></td>
      </tr>
      <tr>
        <td>${element.to}</td>
      </tr>
    </tbody>

    <tbody id="tb" style="visibility: hidden;">
${ttable}
    </tbody>

  </table>`;
            setTimeout(() => {
              scrollToTableRow();
            }, 200);

            function scrollToTableRow() {
              const tbody = document.getElementById('tb');
              const row = document.getElementById(`tr_${element.currentStopSequence}`);
              // document.getElementById(`tri_${element.currentStopSequence}`).style.color = "red";
              document.getElementById(`tri_${element.currentStopSequence}`).classList.add("-active");
              if (tbody && row) {
                // console.log(tbody.scrollTop);
                row.scrollIntoView(true);
                // tbody.scrollTop = row.offsetTop;
              }
		tbody.style.visibility= "visible";
    document.getElementsByClassName(`loader3`)[0].style.display = "none";
            }
          }).on('popupclose', function() {
            document.getElementById("timetable").innerHTML = "";
          });
          switch (markerLayer) {
            case "busstop":
              var objP1 = L.circleMarker([element.lat || element.stop_lat, element.lon || element.stop_lon], {
                radius: 11,
                fillColor: "#fff",
                color: "#000000",
                weight: 1,
                opacity: 1,
                fillOpacity: 1
                // intentDuration: 300
              }).bindPopup(`
              <table>
                <tbody>
                <img src="https://maps.googleapis.com/maps/api/streetview?size=500x500&location=${element.lat || element.stop_lat},${element.lon || element.stop_lon}&fov=80&heading=70&pitch=0&key=AIzaSyAwqhIOd8f0OCpiTxIE_TRy8Uo-H3UMhQY" width="180px">
                  <tr>
                    <td colspan="2"><b>${element.to}</b></td>
                  </tr>
                  <tr>
                  <td rowspan="2" style="background:${color};width:10px;"></td>
                  <td colspan="2"></td>
                </tr>
                </tbody>
              </table>`).on('mouseintent', openPopup).on('mouseover', openPopup).on('mouseout', closePopup);
              busstop.addLayer(objP1);
              map.getZoom();
              map.on('move', function(e) {
                if (map.getZoom() >= 17) {
                  busstop.addTo(map);
                } else {
                  map.removeLayer(busstop);
                }
              });
              break;
              case "busmarker":
                busmarker.addLayer(marker);
                break;
            default:
              break;
          }
        });
        formatTime(timelist);
        document.getElementById("loading").style.display = "none";
        resolve(); // 成功したらresolveを呼ぶ
      }).catch(error => {
        show_popup("#fff", "#ef665b", "情報の収集に失敗しました。", "fa-solid fa-circle-exclamation",5);
        reject(error); // エラーが発生したらrejectを呼ぶ
      });
    });
  }
  try {
    const response = await fetch("output.json");
    buslisted = await response.json();
    gtfstime()
    .then(async (parsedData) => {
      let bustimelist = [];
      if (!parsedData.entity) {
        show_popup("#fff", "#ef665b", "現在運行中のバスはありません。", "fa-solid fa-circle-exclamation",5);
        document.getElementById("tit").innerHTML = "運行データなし";
        document.getElementById("time").innerHTML = "現在、バスはありません。";
        document.getElementById("loading").style.display = "none";
        return;
      }
      for (const entity of parsedData.entity) {
        if (entity.tripUpdate) {
          // コンソールにデータを表示
          bustimelist.push({
            "busname": entity.tripUpdate.trip.tripId,
            "currentStopSequence": entity.tripUpdate.stopTimeUpdate[0].stopSequence,
            "delay": entity.tripUpdate.stopTimeUpdate[0].departure.delay,
            "type": entity.tripUpdate.trip.tripId.match(/系統(\d+)/)[1]
          });
        }
      }
      datatime = bustimelist;
      fetchBusData("busmarker", BusIcon);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
    // show_popup("#fff", "#ef665b", "現在メンテナンス中です。<BR>不具合がある可能性があります。<BR>メンテナンスは4/15 17:00ごろに完了する予定です。", "fa-solid fa-circle-exclamation",0.001);


    setInterval(async () => {
      gtfstime()
      .then(parsedData => {
        // console.log('Parsed data:', parsedData);
        let bustimelist = [];
        parsedData.entity.forEach(function(entity) {
          // console.log(entity.tripUpdate.stopTimeUpdate);
          if (entity.tripUpdate) {
            //コンソールにデータを表示
            bustimelist.push({
              "busname": entity.tripUpdate.trip.tripId,
              "currentStopSequence": entity.tripUpdate.stopTimeUpdate[0].stopSequence,
              "delay": entity.tripUpdate.stopTimeUpdate[0].departure.delay,
              "type": entity.tripUpdate.trip.tripId.match(/系統(\d+)/)[1]
            });
          }
        });
        console.log(bustimelist);
formatTime(bustimelist);
        datatime = bustimelist;
        fetchBusData("busmarker", BusIcon);
        // パースされたデータを使う処理をここに記述
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }, 15000); // 更新間隔
    var GoogleMapSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "<a href='https://aomoricitybus.com/buslocation/' target='_blank'>青ロケ マップ</a>｜<a href='https://developers.google.com/maps/documentation' target='_blank'>Google Map</a>｜<a href='https://nucbox5.dorper-royal.ts.net/' target='_blank'>Toki's system</a>",
    });
    var baseMaps = {
      "オープンストリートマップ": osm,
      "Googleマップ": google,
      "Google 衛星写真": GoogleMapSatellite
    };
    var layers = {
      "青森市営バス(15秒間隔で更新)": busmarker,
      // "バス停": busstop,
      "バス路線": busline
    };
    busmarker.addTo(map);
    L.control.layers(baseMaps, layers).addTo(map);
    document.getElementsByClassName("leaflet-control-layers-list")[0].style.zoom = 1.4;
    
  } catch (error) {
    show_popup("#fff", "#ef665b", "情報の収集に失敗しました。", "fa-solid fa-circle-exclamation",5);
  }
  first_done = true;
}
document.addEventListener("DOMContentLoaded", async function() {
  makemap(null, null, null, false); //仮の座標と倍率をセットし、現在地表示フラグを消す。

});

function alphabet(firstLetter) {
  let alcolor;
  switch (firstLetter) {
    case "A":
      alcolor = "#d92628";
      break;
    case "B":
      alcolor = "#405aa8";
      break;
    case "C":
      alcolor = "#f48e8b";
      break;
    case "E":
      alcolor = "#97ce87";
      break;
    case "F":
      alcolor = "#33974e";
      break;
    case "G":
      alcolor = "#bb8bba";
      break;
    case "H":
      alcolor = "#20595f";
      break;
    case "J":
      alcolor = "#f2642f";
      break;
    case "K":
      alcolor = "#2098d5";
      break;
    case "L":
      alcolor = "#1eb684";
      break;
    case "M":
      alcolor = "#f89c1c";
      break;
    case "P":
      alcolor = "#b32e92";
      break;
    case "R":
      alcolor = "#27c3f3";
      break;
    case "S":
      alcolor = "#769d99";
      break;
    case "T":
      alcolor = "#0078c0";
      break;
    case "U":
      alcolor = "#8d4135";
      break;
    case "W":
      alcolor = "#86c03d";
      break;
    default:
      break;
  }
  return alcolor;
}

function gtfsrt() {
  return new Promise((resolve, reject) => {
    protobuf.load('gtfs-realtime.proto', function(err, root) {
      if (err)
        reject(err);

      var GtfsRealtime = root.lookupType("transit_realtime.FeedMessage");

      function fetchDataFeed(url) {
        return fetch(url)
          .then(response => response.arrayBuffer())
          .then(buffer => new Uint8Array(buffer))
          .catch(error => {
            reject('Error fetching data feed:', error);
          });
      }

      function parseDataFeed(data) {
        var message = GtfsRealtime.decode(data);
        resolve(GtfsRealtime.toObject(message));
      }

      var dataFeedUrl = 'https://api-public.odpt.org/api/v4/gtfs/realtime/odpt_AomoriCity_AllLines_vehicle';

      fetchDataFeed(dataFeedUrl)
        .then(parseDataFeed)
        .catch(error => {
          reject(error);
        });
    });
  });
}
function gtfstime() {
  return new Promise((resolve, reject) => {
    protobuf.load('gtfs-realtime.proto', function(err, root) {
      if (err)
        reject(err);

      var GtfsRealtime = root.lookupType("transit_realtime.FeedMessage");

      function fetchDataFeed(url) {
        return fetch(url)
          .then(response => response.arrayBuffer())
          .then(buffer => new Uint8Array(buffer))
          .catch(error => {
            reject('Error fetching data feed:', error);
          });
      }

      function parseDataFeed(data) {
        var message = GtfsRealtime.decode(data);

        resolve(GtfsRealtime.toObject(message));
      }

      var dataFeedUrl = 'https://api-public.odpt.org/api/v4/gtfs/realtime/odpt_AomoriCity_AllLines_trip_update';

      fetchDataFeed(dataFeedUrl)
        .then(parseDataFeed)
        .catch(error => {
          reject(error);
        });
    });
  });
}

// function name(params) {
//   https://doko-train.jp/json/departure_info/122/2221110660_down.json?_=1713076988169
// }



async function aoi() {
  const response = await fetch("https://nucbox5.dorper-royal.ts.net/proxy?url=http://aoimoriunkou.xsrv.jp/aoi_jp.svg");
  console.log(await response.text());
}
