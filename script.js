// components
const Position = (x, y) => ({ x, y });
const Velocity = (dx, dy) => ({ dx, dy });
const Collider = (radius) => ({ radius });

// entities (groups of components):
const Platform = () => ({});
const FallingObject = () => ({});

//gravity system:applies gravity to entities
const applyGravity = (entities) =>
    entities.map((entity) => {
        if (entity.FallingObject && entity.Velocity) {
            return {
                ...entity,
                Velocity: {
                    dx: entity.Velocity.dx,
                    dy: entity.Velocity.dy + 0.2,
                },
            };
        }
        return entity;
    });

// gravity system: applies gravity to entities
const updatePosition = (entities) =>
    entities.map((entity) => {
        if (entity.Position && entity.Velocity) {
            return {
                ...entity,
                Position: {
                    x: entity.Position.x + entity.Velocity.dx,
                    y: entity.Position.y + entity.Velocity.dy,
                },
            };
        }
        return entity;
    });

const removeOffscreenObjects = (entities) =>
    entities.filter((entity) => !(entity.FallingObject && entity.Position.y > 600));
	
// generates falling balls
const generateFallingObjects = (entities, frameCount) => {
	// grenerate new ball every 40 frames
    if (frameCount % 40 === 0) {
        const fallingObject = createEntity(frameCount, {
            Position: Position(Math.random() * 780, 0),
            Velocity: Velocity(0, Math.random() * 2 + 2),
            FallingObject: FallingObject(),
            Collider: Collider(10),
        });
        return [...entities, fallingObject];
    }
    return entities;
};

const detectCollision = (entities) => {
    let scoreIncrement = 0;

    const platform = entities.find((entity) => entity.Platform);
    if (!platform) return { entities, scoreIncrement };

    const { x: px, y: py } = platform.Position;
    const radius = platform.Collider.radius;

    const updatedEntities = entities.filter((entity) => {
        if (entity.FallingObject) {
            const { x: ox, y: oy } = entity.Position;
            const { radius: oradius } = entity.Collider;

            const dx = ox - px;
            const dy = oy - py;

            if (Math.sqrt(dx * dx + dy * dy) < radius + oradius) {
                scoreIncrement++;
                return false;
            }
        }
        return true;
    });
    return { entities: updatedEntities, scoreIncrement };
};

const render = (entities) => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    entities.forEach((entity) => {
        if (entity.Platform) {
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(entity.Position.x, entity.Position.y, entity.Collider.radius, Math.PI, 0);
            ctx.fill();
        }
        if (entity.FallingObject) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(entity.Position.x, entity.Position.y, entity.Collider.radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
};

const createEntity = (id, components) => ({ id, ...components });

const createPlatform = () =>
    createEntity(1, {
        Position: Position(400, 580),
        Collider: Collider(80),
        Platform: Platform(),
    });

const checkGameOver = (entities) =>
    entities.some((entity) => entity.FallingObject && entity.Position.y > 600);

let gameState = [createPlatform()];
let frameCount = 0;
let score = 0;
let gameOver = false;
const canvas = document.getElementById("gameCanvas");


canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    gameState = gameState.map((entity) =>
        entity.Platform
            ? {
                  ...entity,
                  Position: {
                      x: mouseX,
                      y: entity.Position.y,
                  },
              }
            : entity
    );
});

const resetGame = () => {
    gameOver = false;
    frameCount = 0;
    score = 0;
    gameState = [createPlatform()];
    document.getElementById("scoreDisplay").innerText = "Score: 0";
    document.getElementById("playAgainButton").style.display = "none";
    gameLoop();
};

const gameLoop = () => {
    if (gameOver) {
        document.getElementById("playAgainButton").style.display = "block";
        return;
    }

    frameCount++;

    const systems = [applyGravity, updatePosition];
    gameState = systems.reduce((state, system) => system(state), gameState);

    gameOver = checkGameOver(gameState);

    if (gameOver) {
        document.getElementById("playAgainButton").style.display = "block";
        return;
    }

    gameState = removeOffscreenObjects(gameState);
    gameState = generateFallingObjects(gameState, frameCount);

    const collisionResult = detectCollision(gameState);
    gameState = collisionResult.entities;
    score += collisionResult.scoreIncrement;
    document.getElementById("scoreDisplay").innerText = `Score: ${score}`;

    render(gameState);
    requestAnimationFrame(gameLoop);
};

document.getElementById("playAgainButton").addEventListener("click", resetGame);

gameLoop();
