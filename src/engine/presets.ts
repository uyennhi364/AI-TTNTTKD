import { RoomConfig, RoomObject } from '../types/fengshui';

export interface RoomPreset {
  key: 'master' | 'small' | 'studio';
  name: string;
  config: RoomConfig;
  objects: RoomObject[];
}

export const ROOM_PRESETS: Record<'master' | 'small' | 'studio', RoomPreset> = {
  master: {
    key: 'master',
    name: 'Phòng Ngủ Master Hiện Đại',
    config: {
      width: 5.0,
      length: 5.2,
      height: 2.8,
      direction: 'N',
    },
    objects: [
      // 1. Luxury Upholstered Bed with olive runner & cream cushions (Exact match with reference image)
      {
        id: 'bed_01',
        type: 'bed',
        name: 'Giường đôi bọc nệm 1m6',
        position: { x: -0.05, y: 0, z: 0.55 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        dimensions: { width: 1.6, length: 2.0, height: 0.85 },
      },
      // 2. Large Bedroom Woven Area Rug under bed
      {
        id: 'rug_bed',
        type: 'rug',
        name: 'Thảm phòng ngủ dệt sợi',
        position: { x: -0.05, y: 0, z: 0.55 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 2.2, length: 2.5, height: 0.02 },
      },
      // 3. Bedside Table on right with warm glowing sphere lamp
      {
        id: 'nightstand_right',
        type: 'nightstand',
        name: 'Tủ đầu giường đèn ngủ',
        position: { x: 1.05, y: 0, z: 1.15 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        dimensions: { width: 0.45, length: 0.4, height: 0.5 },
      },
      // 4. Modern Built-in Wardrobe with open illuminated shelving along North wall
      {
        id: 'wardrobe_north',
        type: 'wardrobe',
        name: 'Tủ quần áo kịch trần có kệ',
        position: { x: -0.2, y: 0, z: -2.15 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 2.5, length: 0.6, height: 2.45 },
      },
      // 5. Minimal Walnut Study / Work Desk under window
      {
        id: 'desk_window',
        type: 'desk',
        name: 'Bàn làm việc gỗ walnut',
        position: { x: -1.75, y: 0, z: -0.85 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        dimensions: { width: 1.4, length: 0.65, height: 0.75 },
      },
      // 6. Modern Curved Cream Upholstered Chair
      {
        id: 'chair_desk',
        type: 'chair',
        name: 'Ghế bọc nệm hiện đại',
        position: { x: -1.2, y: 0, z: -0.85 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        dimensions: { width: 0.55, length: 0.55, height: 0.85 },
      },
      // 7. Circular Jute Accent Rug placed under the desk chair
      {
        id: 'rug_desk',
        type: 'rug',
        name: 'Thảm tròn Bắc Âu',
        position: { x: -1.2, y: 0, z: -0.85 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.25, length: 1.25, height: 0.02 },
      },
      // 8. Large Potted Plant in Window/Balcony corner
      {
        id: 'plant_corner',
        type: 'plant',
        name: 'Cây trầu bà Nam Mỹ',
        position: { x: -1.75, y: 0, z: 1.45 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.7, length: 0.7, height: 1.35 },
      },
      // 9. Secondary Potted Plant next to Wardrobe
      {
        id: 'plant_wardrobe',
        type: 'plant',
        name: 'Cây bàng Singapore',
        position: { x: 1.75, y: 0, z: -2.15 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.55, length: 0.55, height: 1.1 },
      },
      // 10. Long White Calacatta Marble Credenza Console along East wall
      {
        id: 'vanity_east',
        type: 'kitchen',
        name: 'Tủ console đá cẩm thạch',
        position: { x: 1.85, y: 0, z: 0.55 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        dimensions: { width: 1.6, length: 0.55, height: 0.88 },
      },
      // 11. Standing Mirror leaning along East wall
      {
        id: 'mirror_01',
        type: 'mirror',
        name: 'Gương đứng toàn thân',
        position: { x: 1.85, y: 0, z: -0.75 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        dimensions: { width: 0.6, length: 0.15, height: 1.6 },
      },
      // 12. Master En-Suite Bathroom Suite with Frosted Glass Walls & Smart Toilet
      {
        id: 'wc_master',
        type: 'wc',
        name: 'Phòng WC Master khép kín',
        position: { x: 1.75, y: 0, z: -1.75 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        dimensions: { width: 1.35, length: 1.55, height: 2.1 },
      },
    ],
  },

  small: {
    key: 'small',
    name: 'Phòng Ngủ Nhỏ Tối Giản',
    config: {
      width: 3.6,
      length: 4.2,
      height: 2.8,
      direction: 'E',
    },
    objects: [
      {
        id: 'bed_small',
        type: 'bed',
        name: 'Giường đơn 1m2',
        position: { x: 0.8, y: 0, z: -0.9 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.2, length: 2.0, height: 0.75 },
      },
      {
        id: 'desk_small',
        type: 'desk',
        name: 'Bàn học 1m2',
        position: { x: -0.8, y: 0, z: 0.8 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.2, length: 0.6, height: 0.75 },
      },
      {
        id: 'chair_small',
        type: 'chair',
        name: 'Ghế học sinh',
        position: { x: -0.8, y: 0, z: 1.3 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.5, length: 0.5, height: 0.85 },
      },
      {
        id: 'wardrobe_small',
        type: 'wardrobe',
        name: 'Tủ quần áo 2 cánh',
        position: { x: -1.2, y: 0, z: -0.9 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        dimensions: { width: 1.2, length: 0.6, height: 2.1 },
      },
      {
        id: 'mirror_small',
        type: 'mirror',
        name: 'Gương soi',
        position: { x: 1.3, y: 0, z: 1.2 },
        rotation: { x: 0, y: -Math.PI / 3, z: 0 },
        dimensions: { width: 0.5, length: 0.1, height: 1.5 },
      },
      {
        id: 'door_small',
        type: 'door',
        name: 'Cửa ra vào',
        position: { x: -0.8, y: 0, z: 2.0 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        dimensions: { width: 0.85, length: 0.1, height: 2.0 },
      },
      {
        id: 'window_small',
        type: 'window',
        name: 'Cửa sổ',
        position: { x: 1.7, y: 0.8, z: 0.2 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        dimensions: { width: 1.2, length: 0.1, height: 1.2 },
      },
    ],
  },

  studio: {
    key: 'studio',
    name: 'Căn Hộ Studio Đa Năng',
    config: {
      width: 4.0,
      length: 5.5,
      height: 2.8,
      direction: 'S',
    },
    objects: [
      {
        id: 'bed_studio',
        type: 'bed',
        name: 'Giường thông minh 1m6',
        position: { x: 1.0, y: 0, z: -1.5 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.6, length: 2.0, height: 0.8 },
      },
      {
        id: 'sofa_studio',
        type: 'sofa',
        name: 'Sofa góc phòng khách',
        position: { x: -1.0, y: 0, z: 0.5 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        dimensions: { width: 1.6, length: 0.8, height: 0.75 },
      },
      {
        id: 'desk_studio',
        type: 'desk',
        name: 'Bàn làm việc studio',
        position: { x: 1.0, y: 0, z: 0.8 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        dimensions: { width: 1.4, length: 0.7, height: 0.75 },
      },
      {
        id: 'kitchen_studio',
        type: 'kitchen',
        name: 'Kệ bếp đa năng',
        position: { x: -1.2, y: 0, z: -1.8 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        dimensions: { width: 1.8, length: 0.6, height: 0.85 },
      },
      {
        id: 'wardrobe_studio',
        type: 'wardrobe',
        name: 'Tủ âm tường',
        position: { x: -1.2, y: 0, z: -0.6 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        dimensions: { width: 1.4, length: 0.6, height: 2.2 },
      },
      {
        id: 'door_studio',
        type: 'door',
        name: 'Cửa ra vào',
        position: { x: 0, y: 0, z: 2.6 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        dimensions: { width: 0.9, length: 0.1, height: 2.0 },
      },
    ],
  },
};
