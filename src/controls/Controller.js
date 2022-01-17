import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

export { Controller };

class Controller {
  constructor(object, domElement) {
    if (domElement === undefined) {
      domElement = document;
    }

    this.object = object;
    this.domElement = domElement;

    this.enabled = true;

    // physics constants, might put in a separate file later
    this.fMove = 400;
    this.sMove = 400;
    this.wishSpeed = 260;
    this.maxAirSpeed = 30;
    this.acceleration = 5;
    this.airAcceleration = 1000;
    this.surfaceFriction = 1;
    this.friction = 4;
    this.stopSpeed = 75;
    this.gravity = 800;
    this.jumpHeight = 56;
    this.jumpImpulse = Math.sqrt(2 * this.gravity * this.jumpHeight);

    // controller
    // this.playerCollider = new Box3(1, 1);
    this.velocity = new THREE.Vector3();
    this.wishDirection = new THREE.Vector3();
    this.wishVelocity = new THREE.Vector3();
    this.playerDirection = new THREE.Vector3();
    this.playerHeight = 64;
    this.onGround = false;
    this.keyStates = {};

    // mouse
    this.mouseYaw = 0.022;
    this.mousePitch = 0.022;
    this.mouseSensitivity = 3;

    // input
    document.addEventListener("keydown", event => {
      this.keyStates[event.code] = true;
    });

    document.addEventListener("keyup", event => {
      this.keyStates[event.code] = false;
    });

    this.domElement.addEventListener("mousedown", () => {
      this.domElement.requestPointerLock();
    });

    this.domElement.addEventListener("mousemove", event => {
      if (document.pointerLockElement === this.domElement) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // TODO use sensitivity values
        this.object.rotation.y -= movementX / 500;
        this.object.rotation.x -= movementY / 500;

        // clamp pitch
        if (this.object.rotation.x > Math.PI / 2 - 0.01) {
          this.object.rotation.x = Math.PI / 2 - 0.01;
        } else if (this.object.rotation.x < -Math.PI / 2 + 0.01) {
          this.object.rotation.x = -Math.PI / 2 + 0.01;
        }
      }
    });
  }

  updateControls() {
    let moveLeft, moveRight, moveForward, moveBack;
    [moveLeft, moveRight, moveForward, moveBack] = [0, 0, 0, 0];

    if (this.keyStates["KeyW"]) {
      moveForward = 1;
    }
    if (this.keyStates["KeyS"]) {
      moveBack = 1;
    }
    if (this.keyStates["KeyA"]) {
      moveLeft = 1;
    }
    if (this.keyStates["KeyD"]) {
      moveRight = 1;
    }

    const forward = (moveForward - moveBack) * this.fMove;
    const side = (moveRight - moveLeft) * this.sMove;

    this.wishVelocity.x = this.getForwardVector().x * forward + this.getSideVector().x * side;
    this.wishVelocity.y = 0;
    this.wishVelocity.z = this.getForwardVector().z * forward + this.getSideVector().z * side;

    this.wishDirection = this.wishVelocity.clone().normalize();
  }

  updatePlayer(deltaTime) {
    this.updateControls();

    // for now, player is grounded if their y is less than height
    this.onGround = this.object.position.y <= this.playerHeight;

    if (this.keyStates["Space"] && this.onGround) {
      this.velocity.y = this.jumpImpulse;
      this.onGround = false;
    }

    if (!this.onGround) {
      this.velocity.y -= this.gravity * deltaTime;
      this.airAccelerate(this.wishDirection, this.wishSpeed, deltaTime);
    } else {
      // need a function to get surface of player to update surfaceFriction
      this.velocity.y = 0;
      this.doFriction(this.velocity, deltaTime);
      this.accelerate(this.wishDirection, this.wishSpeed, deltaTime);
    }

    // update player's position
    const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
    this.object.position.add(deltaPosition);

    // this.playerCollider.translate(deltaPosition);
    // this.playerCollisions();
  }

  getForwardVector() {
    this.object.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();

    return this.playerDirection;
  }

  getSideVector() {
    this.object.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();
    this.playerDirection.cross(this.object.up);
    return this.playerDirection;
  }

  // applies acceleration on the ground
  accelerate(wishDirection, wishSpeed, deltaTime) {
    let addSpeed, accelSpeed, currentSpeed;

    // currentSpeed is the component of velocity along wishDirection
    currentSpeed = this.velocity.clone().dot(wishDirection);

    addSpeed = wishSpeed - currentSpeed;

    if (addSpeed <= 0) return;

    accelSpeed = this.acceleration * wishSpeed * this.surfaceFriction * deltaTime;

    if (accelSpeed > addSpeed) accelSpeed = addSpeed;

    this.velocity.add(wishDirection.multiplyScalar(accelSpeed));
  }

  doFriction(velocity, deltaTime) {
    let drop = 0;
    const speed = velocity.length();

    if (speed < 0.1) return velocity;

    const friction = this.friction * this.surfaceFriction;
    const control = speed < this.stopSpeed ? this.stopSpeed : speed;

    drop += control * friction * deltaTime;

    let newSpeed = speed - drop;

    newSpeed = newSpeed < 0 ? 0 : newSpeed;

    if (newSpeed !== speed) {
      newSpeed /= speed;
      velocity.multiplyScalar(newSpeed);
    }
  }

  // applies acceleration in the air
  airAccelerate(wishDirection, wishSpeed, deltaTime) {
    let addSpeed, accelSpeed, currentSpeed;

    // prevents player from accelerating too much in one direction
    const wishSpeedCapped = Math.min(this.maxAirSpeed, wishSpeed);

    // currentSpeed is the component of velocity along wishDirection
    currentSpeed = this.velocity.clone().dot(wishDirection);

    addSpeed = wishSpeedCapped - currentSpeed;

    if (addSpeed <= 0) return;

    accelSpeed = this.airAcceleration * wishSpeed * this.surfaceFriction * deltaTime;

    if (accelSpeed > addSpeed) accelSpeed = addSpeed;

    this.velocity.add(wishDirection.multiplyScalar(accelSpeed));
  }
}