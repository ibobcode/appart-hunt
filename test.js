const fetch = require("node-fetch");

// fetch("https://api.leboncoin.fr/api/utils/phonenumber.json", {
//   headers: {
//     accept: "application/json",
//     "content-type": "application/x-www-form-urlencoded"
//   },
//   body:
//     "app_id=leboncoin_web_utils&key=54bb0281238b45a03f0ee695f73e704f&list_id=1680778451&text=1",
//   method: "POST"
// }).then(a => a.text().then(a => console.log(a)));

fetch("https://api.leboncoin.fr/finder/search", {
  headers: {
    "content-type": "application/json",
    "sec-fetch-mode": "cors"
  },
  body:
    '{"filters":{"category":{"id":"10"},"enums":{"ad_type":["offer"],"real_estate_type":["2"]},"keywords":{},"location":{"locations":[{"locationType":"city","city":"Paris","zipcode":"75018","label":"Paris (75018)","area":{"lat":48.89187,"lng":2.34809,"default_radius":1961}},{"locationType":"city","city":"Paris","zipcode":"75010","label":"Paris (75010)","area":{"lat":48.87615,"lng":2.36233,"default_radius":1253}},{"locationType":"city","city":"Paris","zipcode":"75009","label":"Paris (75009)","area":{"lat":48.877,"lng":2.33789,"default_radius":1209}},{"locationType":"city","city":"Paris","zipcode":"75008","label":"Paris (75008)","area":{"lat":48.87294,"lng":2.31125,"default_radius":1664}},{"locationType":"city","city":"Paris","zipcode":"75004","label":"Paris (75004)","area":{"lat":48.85428,"lng":2.36147,"default_radius":1251}},{"locationType":"city","city":"Paris","zipcode":"75005","label":"Paris (75005)","area":{"lat":48.84533,"lng":2.3519,"default_radius":1281}},{"locationType":"city","city":"Paris","zipcode":"75003","label":"Paris (75003)","area":{"lat":48.86256,"lng":2.35905,"default_radius":1020}},{"locationType":"city","city":"Paris","zipcode":"75002","label":"Paris (75002)","area":{"lat":48.86772,"lng":2.34304,"default_radius":1125}},{"locationType":"city","city":"Paris","zipcode":"75001","label":"Paris (75001)","area":{"lat":48.85718,"lng":2.34141,"default_radius":9853}},{"locationType":"city","city":"Paris","zipcode":"75017","label":"Paris (75017)","area":{"lat":48.88707,"lng":2.30629,"default_radius":2329}}]},"ranges":{"price":{"min":700,"max":1000},"rooms":{"max":3},"square":{"min":20,"max":40}}},"limit":35,"limit_alu":3,"user_id":"e205dab5-ec04-462b-af1f-030c7ab8b113","store_id":"28178725"}',
  method: "POST",
}).then(a => a.text().then(a => console.log(JSON.parse(a))));
