/**
 * Room Avatar Renderer & Physics Controller
 * Handles Chibi HeeHee character rendering, walk cycle animation, and floor movement physics
 */

export const RoomAvatar = {
  /**
   * Updates player position, walk frames, facing direction, and constraints
   */
  updatePhysics(player, input, bounds, onStep) {
    const inX = input.x || 0;
    const inY = input.y || 0;
    const mag = Math.hypot(inX, inY);

    if (player.vx === undefined) player.vx = 0;
    if (player.vy === undefined) player.vy = 0;
    if (player.facingScale === undefined) player.facingScale = player.facing === 'left' ? -1 : 1;
    if (player.stepTick === undefined) player.stepTick = 0;

    // Analog velocity control: speed scales with joystick displacement
    const maxSpeed = player.speed || 3.5;
    let targetVx = 0;
    let targetVy = 0;

    if (mag > 0.08) {
      if (player.state === 'sitting' || player.state === 'sleeping') {
        player.state = 'idle';
      }

      // Analog sensitivity: gentle push = slow walk, full push = trot
      const pushFactor = Math.min(1.0, (mag - 0.08) / 0.82 + 0.35);
      const nx = inX / mag;
      const ny = inY / mag;

      targetVx = nx * maxSpeed * pushFactor;
      targetVy = ny * maxSpeed * pushFactor;

      // Facing logic with hysteresis to prevent twitching
      if (Math.abs(inX) > Math.abs(inY) * 0.55) {
        player.facing = inX > 0 ? 'right' : 'left';
      } else {
        player.facing = inY > 0 ? 'down' : 'up';
      }
    }

    // Smooth inertia / acceleration / braking interpolation
    const lerpRate = mag > 0.08 ? 0.24 : 0.28;
    player.vx += (targetVx - player.vx) * lerpRate;
    player.vy += (targetVy - player.vy) * lerpRate;

    const currentSpeed = Math.hypot(player.vx, player.vy);
    if (currentSpeed < 0.05) {
      player.vx = 0;
      player.vy = 0;
      player.isMoving = false;
    } else {
      player.isMoving = true;
    }

    // Apply smooth movement
    const newX = player.x + player.vx;
    const newY = player.y + player.vy;

    player.x = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    player.y = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

    // Smooth 2.5D turnaround scaling (player.facingScale smoothly transitions between -1 <-> 1)
    let targetFacingScale = 1;
    if (player.facing === 'left') {
      targetFacingScale = -1;
    } else if (player.facing === 'right') {
      targetFacingScale = 1;
    } else {
      targetFacingScale = player.facingScale < 0 ? -1 : 1;
    }
    player.facingScale += (targetFacingScale - player.facingScale) * 0.28;

    // Step cycle cadence proportional to actual velocity (eliminates foot-sliding)
    if (player.isMoving) {
      const prevStep = Math.sin(player.stepTick * 2.2);
      player.stepTick += currentSpeed * 0.09;
      const newStep = Math.sin(player.stepTick * 2.2);

      // Trigger footstep contact event for particles
      if (prevStep < 0 && newStep >= 0 && typeof onStep === 'function') {
        onStep(player.x, player.y + 32, player.vx);
      }
    } else {
      player.stepTick = 0;
    }
  },

  /**
   * Renders fully animated Chibi HeeHee avatar matching reference design
   * Features real walking legs & shoes, swinging arms, swaying skirt,
   * bouncing hair, blinking eyes, and 0 background artifacts.
   */
  drawPlayer(ctx, player, tick) {
    const px = Math.floor(player.x);
    const py = Math.floor(player.y);
    const isMoving = player.isMoving;
    const facing = player.facing;
    const state = player.state;

    ctx.save();

    // 1. Dynamic Animation Parameters
    let bob = 0;
    let tilt = 0;
    let squashX = 1.0;
    let squashY = 1.0;

    if (state === 'sitting') {
      bob = -6;
      squashY = 0.96;
      squashX = 1.04;
    } else if (isMoving) {
      // Natural Walk Cycle
      bob = Math.abs(Math.sin(player.stepTick * 2.2)) * 3.5;
      const stepProgress = Math.cos(player.stepTick * 4.4);
      squashY = 1.0 + stepProgress * 0.055;
      squashX = 1.0 - stepProgress * 0.045;
      tilt = Math.sin(player.stepTick * 2.2) * 0.06;
    } else {
      // Idle Gentle Breathing
      const breath = Math.sin(tick * 0.06);
      bob = breath * 1.2;
      squashY = 1.0 + breath * 0.025;
      squashX = 1.0 - breath * 0.018;
    }

    // 2. Ground Contact Shadow (reacts dynamically to step height)
    const shadowScale = 1.0 - Math.max(0, bob) * 0.05;
    const shadowAlpha = 0.45 - Math.max(0, bob) * 0.04;
    ctx.fillStyle = `rgba(15, 8, 5, ${Math.max(0.12, shadowAlpha)})`;
    ctx.beginPath();
    ctx.ellipse(px, py + 14, 15 * shadowScale, 5.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Transformation: Anchor at feet pivot with smooth 2.5D turnaround scaling
    ctx.translate(px, py + 14);
    const fScale = player.facingScale ?? (facing === 'left' ? -1 : 1);
    ctx.scale(fScale * squashX, squashY);
    ctx.rotate(tilt);

    const drawY = -bob;

    // 4. Shoes & Socks Walk Cycle Animation
    if (state === 'sitting') {
      // Sitting pose: feet tucked comfortably
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, drawY - 4, 14, 3);
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-8, drawY - 2, 16, 4);
    } else if (isMoving) {
      const legSwing = Math.sin(player.stepTick * 2.2) * 5.5;
      const legLift1 = Math.max(0, -Math.sin(player.stepTick * 2.2)) * 3.5;
      const legLift2 = Math.max(0, Math.sin(player.stepTick * 2.2)) * 3.5;

      // Left Leg: White sock + Mary Jane Shoe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7 + legSwing, drawY - 8 - legLift1, 5, 5);
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-8 + legSwing, drawY - 4 - legLift1, 6.5, 4.5);
      // Buckle detail
      ctx.fillStyle = '#fdcb6e';
      ctx.fillRect(-6 + legSwing, drawY - 3.5 - legLift1, 1.5, 1.5);

      // Right Leg: White sock + Mary Jane Shoe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2 - legSwing, drawY - 8 - legLift2, 5, 5);
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(1.5 - legSwing, drawY - 4 - legLift2, 6.5, 4.5);
      // Buckle detail
      ctx.fillStyle = '#fdcb6e';
      ctx.fillRect(3.5 - legSwing, drawY - 3.5 - legLift2, 1.5, 1.5);
    } else {
      // Idle standing feet
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6.5, drawY - 8, 5, 5);
      ctx.fillRect(1.5, drawY - 8, 5, 5);
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-7, drawY - 4, 6, 4.5);
      ctx.fillRect(1, drawY - 4, 6, 4.5);
      // Buckles
      ctx.fillStyle = '#fdcb6e';
      ctx.fillRect(-5.5, drawY - 3.5, 1.5, 1.5);
      ctx.fillRect(2.5, drawY - 3.5, 1.5, 1.5);
    }

    // 5. Voluminous Brown Hair (Back Layer)
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.ellipse(0, drawY - 26, 17, 21, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Arms & Dress System with dynamic Outfit customization
    const armSwing = isMoving ? Math.sin(player.stepTick * 2.2) * 5.2 : 0;
    const skirtTilt = isMoving ? Math.sin(player.stepTick * 2.2) * 1.8 : 0;

    // Resolve outfit colors: default Lolita Pastel or equipped outfit skin
    const outfit = player.outfit || {};
    const dressColor = outfit.dressColor || '#f78da7';
    const trimColor = outfit.trimColor || '#ffffff';
    const collarColor = outfit.collarColor || '#ffffff';
    const sleeveColor = outfit.sleeveColor || dressColor;

    // Left Arm (swings opposite)
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(-14 - armSwing * 0.4, drawY - 25 + armSwing * 0.3, 5, 10);
    ctx.fillStyle = '#ffeaa7'; // hand
    ctx.fillRect(-14 - armSwing * 0.4, drawY - 15 + armSwing * 0.3, 4, 4);

    // Right Arm (swings opposite)
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(9 + armSwing * 0.4, drawY - 25 - armSwing * 0.3, 5, 10);
    ctx.fillStyle = '#ffeaa7'; // hand
    ctx.fillRect(10 + armSwing * 0.4, drawY - 15 - armSwing * 0.3, 4, 4);

    // Flared A-Line Dress
    ctx.fillStyle = dressColor;
    ctx.beginPath();
    ctx.moveTo(-12 + skirtTilt, drawY - 8);
    ctx.lineTo(12 + skirtTilt, drawY - 8);
    ctx.lineTo(8, drawY - 25);
    ctx.lineTo(-8, drawY - 25);
    ctx.closePath();
    ctx.fill();

    // Dress hemline lace / gold trim
    ctx.fillStyle = trimColor;
    ctx.fillRect(-12 + skirtTilt, drawY - 9, 24, 2.5);

    // Decorative Peter Pan Collar
    ctx.fillStyle = collarColor;
    ctx.beginPath();
    ctx.ellipse(-4, drawY - 25, 4.2, 3, 0.2, 0, Math.PI * 2);
    ctx.ellipse(4, drawY - 25, 4.2, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Head & Peach Complexion
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(0, drawY - 33, 12.5, 0, Math.PI * 2);
    ctx.fill();

    // 8. Front Hair Dome & Bangs
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.arc(0, drawY - 36, 13.5, Math.PI, 0);
    ctx.fill();
    // Warm hair highlight
    ctx.fillStyle = '#7a4b33';
    ctx.beginPath();
    ctx.arc(-2, drawY - 40, 7, 0.4, Math.PI - 0.4);
    ctx.fill();

    // Rounded soft bangs
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.arc(0, drawY - 38, 11, 0.2, Math.PI - 0.2);
    ctx.fill();

    // Twin wavy side locks framing face with subtle secondary bounce
    const hairBounce = isMoving ? Math.sin(player.stepTick * 2.2 - 0.5) * 1.8 : 0;
    ctx.fillRect(-14, drawY - 35, 5, 23 + hairBounce);
    ctx.fillRect(9, drawY - 35, 5, 23 - hairBounce);

    // Pink flower hairpin on right temple
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(10, drawY - 39, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, drawY - 39, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 9. Facial Features
    if (facing !== 'up') {
      // Rosy Cheeks Blush
      ctx.fillStyle = '#fab1a0';
      ctx.fillRect(-9, drawY - 30, 4.5, 2.8);
      ctx.fillRect(4.5, drawY - 30, 4.5, 2.8);

      // Sweet tiny mouth
      ctx.fillStyle = '#e17055';
      ctx.fillRect(-1, drawY - 27, 2, 1.2);

      // Expressive Anime Eyes
      const isBlinking = (!isMoving && tick % 160 > 152) || state === 'sleeping';
      if (isBlinking) {
        // Cute happy closed eyes (^ ^)
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-5, drawY - 32, 2.5, Math.PI, 0);
        ctx.arc(5, drawY - 32, 2.5, Math.PI, 0);
        ctx.stroke();
      } else {
        // Big open anime eyes with specular highlights
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(-7, drawY - 35, 3.8, 5.2);
        ctx.fillRect(3.5, drawY - 35, 3.8, 5.2);
        // White specular catchlight dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-7, drawY - 35, 1.8, 2);
        ctx.fillRect(3.5, drawY - 35, 1.8, 2);
      }
    } else {
      // Facing Up: back of head hair
      ctx.fillStyle = '#4a2810';
      ctx.beginPath();
      ctx.arc(0, drawY - 34, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
};

