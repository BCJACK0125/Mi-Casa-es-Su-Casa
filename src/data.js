// Room rectangles (minimap, area titles) and memory photo spots.
// rect = [x0, x1, z0, z1] in meters; +x east, +z south.
export const ROOMS = [
  { id: 'car', name: '電梯', en: 'Elevator', rect: [5.25, 6.6, 11.05, 12.75], color: '#c9c3b4' },
  { id: 'lobby', name: '電梯梯廳', en: 'Lobby', rect: [6.6, 8.3, 10.7, 13.4], color: '#cfc6b6' },
  { id: 'stairs', name: '樓梯間', en: 'Stairwell', rect: [8.3, 11.8, 10.7, 13.4], color: '#d8b9b2' },
  { id: 'mbath', name: '主臥浴室', en: 'Master Bath', rect: [1.3, 3.5, 0, 2.3], color: '#a9cbd8' },
  { id: 'bath2', name: '浴室', en: 'Bathroom', rect: [3.9, 5.95, 0, 2.3], color: '#a9cbd8' },
  { id: 'master', name: '主臥室', en: 'Master Bedroom', rect: [1.3, 4.95, 2.3, 6.1], color: '#b7c6e6' },
  { id: 'hall', name: '走道', en: 'Hallway', rect: [4.95, 5.95, 2.3, 10.1], color: '#ece6d8' },
  { id: 'dining', name: '餐廳', en: 'Dining Room', rect: [1.3, 4.95, 6.1, 10.1], color: '#cfe3b5' },
  { id: 'balcony', name: '陽台', en: 'Balcony', rect: [0, 1.3, 6.1, 10.1], color: '#f2b38f' },
  { id: 'room1', name: '房間一', en: 'Room One', rect: [5.95, 11, 0.6, 3.68], color: '#a8dcc4' },
  { id: 'room2', name: '房間二', en: 'Room Two', rect: [5.95, 11, 3.68, 6.52], color: '#e3c99b' },
  { id: 'living', name: '客廳', en: 'Living Room', rect: [5.95, 11, 6.52, 10.7], color: '#f0d9a0' },
  { id: 'kitchen', name: '廚房', en: 'Kitchen', rect: [0, 3.75, 10.1, 12.5], color: '#e9c2c2' },
];

export function roomAt(x, z) {
  for (const r of ROOMS) {
    const [x0, x1, z0, z1] = r.rect;
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return r;
  }
  return null;
}

// Door gaps for the minimap: [x0,z0,x1,z1]
export const MAP_DOORS = [
  [2.65, 2.3, 3.4, 2.3], [5.06, 2.3, 5.84, 2.3], [4.95, 2.45, 4.95, 3.3], [5.95, 2.8, 5.95, 3.6], [5.95, 3.8, 5.95, 4.6],
  [5.95, 9.15, 5.95, 10.05], [2.75, 10.1, 3.55, 10.1], [1.3, 7.0, 1.3, 9.2], [6.7, 10.7, 7.9, 10.7], [6.6, 11.5, 6.6, 12.3],
  [4.95, 8.47, 4.95, 10.1], [4.95, 6.1, 4.95, 6.2],
];

// Memory spots: the real photos, placed roughly where they were taken.
// yaw: direction the camera was facing (0 = north/-z, PI/2 = west ... see player yaw convention).
export const MEMORIES = [
  { id: 'lobby', room: '電梯梯廳', photo: 'assets/photos/lobby.jpg', x: 7.9, z: 12.7, title: '回家的門口', note: '青綠色的電梯門、花崗石牆，右手邊是不鏽鋼鐵門和鞋架。' },
  { id: 'hall', room: '走道', photo: 'assets/photos/hall.jpg', x: 5.45, z: 9.0, title: '長長的走道', note: '左邊是有弧形端的吧檯和展示櫃，右邊是蝕刻魚群的玻璃窗。' },
  { id: 'living', room: '客廳', photo: 'assets/photos/living.jpg', x: 8.4, z: 9.4, title: '八駿圖', note: '客廳北牆的八駿圖與兩幅書法：「嚴正世所知」「高節人和重」。' },
  { id: 'dining', room: '餐廳', photo: 'assets/photos/dining.jpg', x: 4.1, z: 8.9, title: '餐桌', note: '綠色玻璃桌面、三顆蛋形吊燈，後面是通往陽台的落地窗。' },
  { id: 'kitchen', room: '廚房', photo: 'assets/photos/kitchen.jpg', x: 3.2, z: 10.85, title: '廚房', note: '東西向的一字型流理台，抽油煙機旁邊是小窗戶，對面是鐵架與電鍋。' },
  { id: 'balcony', room: '陽台', photo: 'assets/photos/balcony.jpg', x: 0.65, z: 9.3, title: '陽台', note: '橘色天花板、晾著的衣服，盡頭是洗衣機。' },
  { id: 'master', room: '主臥室', photo: 'assets/photos/master.jpg', x: 3.3, z: 2.9, title: '主臥室', note: '整面白色衣櫃、木頭床架，窗邊有小碎花窗簾。' },
  { id: 'mbath', room: '主臥浴室', photo: 'assets/photos/bath.jpg', x: 3.0, z: 1.95, title: '浴室', note: '浴缸、立柱式洗手台和黃色馬桶蓋。' },
  { id: 'room1', room: '房間一', photo: 'assets/photos/room1.jpg', x: 8.6, z: 1.9, title: '房間一', note: '兩座書櫃、電子琴，還有拼接地墊。' },
  { id: 'room2', room: '房間二', photo: 'assets/photos/room2.jpg', x: 6.9, z: 4.9, title: '房間二', note: '木地板、窗下的長書桌與吊櫃書架。' },
];
