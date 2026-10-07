// Pixel Art Ingredient Icon Renderer for Wholesale Market & UI

export function drawIngredientPixelArt(canvas, ingId) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;

  const s = Math.floor(w / 16);
  ctx.fillStyle = '#221524';
  ctx.fillRect(0, 0, w, h);

  function px(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * s, y * s, s, s);
  }

  function rect(x, y, rw, rh, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * s, y * s, rw * s, rh * s);
  }

  switch (ingId) {
    case 'tra_den':
      rect(4, 5, 8, 8, '#593219');
      rect(5, 6, 6, 6, '#7c4322');
      rect(4, 4, 8, 2, '#422411');
      rect(6, 3, 4, 2, '#8b4513');
      rect(6, 5, 4, 1, '#f4c430');
      px(5, 6, '#f4c430'); px(10, 6, '#f4c430');
      px(7, 8, '#2fa364'); px(8, 8, '#2fa364'); px(8, 9, '#1e6840');
      break;

    case 'tra_thai_xanh':
      rect(4, 4, 8, 9, '#1e6840');
      rect(5, 5, 6, 7, '#2fa364');
      rect(6, 6, 4, 5, '#50fa7b');
      rect(6, 8, 4, 2, '#ffffff');
      rect(7, 10, 2, 1, '#ffffff');
      rect(4, 3, 8, 2, '#144c2d');
      rect(6, 2, 4, 1, '#f4c430');
      break;

    case 'sua_tuoi':
      rect(5, 3, 6, 11, '#dfe6e9');
      rect(6, 4, 4, 9, '#ffffff');
      rect(5, 2, 6, 2, '#74b9ff');
      rect(6, 1, 4, 1, '#0984e3');
      rect(6, 6, 2, 2, '#2d3436');
      rect(8, 9, 2, 2, '#2d3436');
      px(7, 7, '#74b9ff');
      break;

    case 'tra_lai':
      rect(4, 5, 8, 8, '#d4882b');
      rect(5, 6, 6, 6, '#f39c12');
      rect(5, 3, 6, 3, '#b7751c');
      px(8, 8, '#f1fa8c');
      px(8, 7, '#ffffff'); px(8, 9, '#ffffff');
      px(7, 8, '#ffffff'); px(9, 8, '#ffffff');
      px(6, 9, '#2fa364');
      break;

    case 'tra_olong':
      rect(4, 6, 8, 7, '#59341d');
      rect(5, 7, 6, 5, '#7a4828');
      rect(5, 5, 6, 2, '#3d2313');
      rect(6, 4, 4, 1, '#f4c430');
      px(6, 2, '#ced6e0'); px(7, 1, '#ced6e0'); px(9, 2, '#ced6e0');
      break;

    case 'tranchau_den':
      rect(3, 8, 10, 5, '#3c2436');
      rect(4, 9, 8, 4, '#57334d');
      px(5, 6, '#1f1620'); px(6, 6, '#483446');
      px(7, 5, '#1f1620'); px(8, 5, '#483446');
      px(9, 6, '#1f1620'); px(10, 6, '#483446');
      px(6, 7, '#1f1620'); px(8, 7, '#1f1620'); px(10, 7, '#1f1620');
      break;

    case 'thach_la_dua':
      rect(4, 7, 4, 4, '#2ed573');
      rect(5, 8, 2, 2, '#7bed9f');
      rect(8, 6, 4, 4, '#1e824c');
      rect(9, 7, 2, 2, '#2ed573');
      rect(6, 10, 4, 3, '#10ac84');
      px(9, 3, '#2ed573'); px(10, 4, '#2ed573'); px(11, 5, '#1e824c');
      break;

    case 'tranchau_duongden':
      rect(5, 5, 6, 8, '#5c3a21');
      rect(6, 6, 4, 6, '#874d28');
      rect(6, 3, 4, 3, '#3b2212');
      rect(6, 2, 4, 1, '#f4c430');
      px(8, 10, '#f4c430'); px(8, 12, '#f4c430'); px(7, 13, '#f4c430');
      break;

    case 'dao_mieng':
      rect(4, 5, 5, 8, '#ffa502');
      rect(5, 6, 3, 6, '#ff7f50');
      rect(8, 7, 4, 5, '#ffa502');
      rect(9, 8, 2, 3, '#ff6348');
      px(11, 6, '#2ed573');
      break;

    case 'cam_vang':
      rect(4, 4, 8, 8, '#ff9f43');
      rect(5, 5, 6, 6, '#feca57');
      rect(6, 6, 4, 4, '#ff9f43');
      px(4, 4, '#ee5253'); px(11, 4, '#ee5253'); px(4, 11, '#ee5253'); px(11, 11, '#ee5253');
      px(8, 2, '#10ac84'); px(9, 3, '#1dd1a1');
      break;

    case 'sa_tuoi':
      rect(5, 3, 3, 10, '#a8e6cf');
      rect(6, 2, 2, 11, '#1dd1a1');
      rect(8, 5, 3, 8, '#c8d6e5');
      rect(9, 4, 2, 9, '#10ac84');
      px(5, 2, '#2ed573'); px(8, 3, '#2ed573');
      break;

    case 'suong_sao':
      rect(4, 7, 4, 4, '#2f3542');
      rect(5, 8, 2, 2, '#57606f');
      rect(8, 6, 4, 4, '#1e272e');
      rect(9, 7, 2, 2, '#3d4b56');
      rect(6, 10, 4, 3, '#1e272e');
      px(6, 5, '#2ed573'); px(7, 6, '#2ed573');
      break;

    case 'ly_nap':
    default:
      rect(5, 4, 6, 9, '#74b9ff');
      rect(6, 5, 4, 7, '#ffffff');
      rect(4, 3, 8, 2, '#ff79c6');
      rect(5, 2, 6, 1, '#bd93f9');
      px(8, 0, '#f4c430'); px(7, 1, '#f4c430'); px(7, 2, '#f4c430');
      px(6, 10, '#2d3436'); px(7, 10, '#2d3436'); px(8, 10, '#2d3436');
      break;
  }
}

