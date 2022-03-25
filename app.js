var conveyors = [];

class Box {
    constructor(displayElement) {
        this.displayElement = displayElement
        this.position = 0.0;
        this.speed = 0.3;
        this.deltaTime = 1000;

        const movementInterval = setInterval(() => {
            this.position += this.speed / this.deltaTime;

            if (this.position >= 1) clearInterval(movementInterval);
        }, 1000 / this.deltaTime);
    }
}

class Conveyor {
    #loop = null;

    constructor(svg) {
        this.boxes = [];
        this.svg = svg;
        this.refreshRate = 25;
        this.pathElement = svg.getElementsByClassName('conveyor-path')[0];
        this.start();
    }

    get path() {
        return this.pathElement;
    }

    get pathLength() {
        return this.pathElement.getTotalLength();
    }

    getPointAtLength(x) {
        return this.pathElement.getPointAtLength(x);
    }

    setTruck(truck) {
        this.truck = truck;
    }

    addBox(box) {
        this.svg.appendChild(box.displayElement);
        return this.boxes.push(box);
    }

    start() {
        this.#loop = setInterval(() => {
            this.#updateConveyor(this)
        }, this.refreshRate);
    }

    pause() {
        clearInterval(this.#loop);
    }

    #updateConveyor(conveyor) {
        for (const box of conveyor.boxes) {
            let p = conveyor.getPointAtLength(box.position * conveyor.pathLength);
            box.displayElement.setAttribute("transform", `translate(${p.x - box.displayElement.getAttribute('width') / 2}, ${p.y - box.displayElement.getAttribute('height') / 2})`);

            if (box.position == 1) {
                conveyor.boxes.remove(box);
            }
        }
    }
}

class Truck {
    constructor(length, width, type, distance) {
        this.length = length;
        this.width = width;
        this.type = type;
        this.distance = distance;
    }

    get truckImage() {
        // TODO: Return truck image div
    }
}

initialiseTruckVisualisation();
initialisePackageConveyor();

function initialiseTruckVisualisation() {
    const truckLengths = ["short", "middle", "long"];
    const truckWidths = ["narrow", "middle", "wide"];
    const truck = document.querySelector('#truck > .preview > .truck-image');
    const form = document.getElementById('truck-form');
    const length = document.getElementById('truck-length');
    const width = document.getElementById('truck-width');

    length.addEventListener('input', (e) => {
        let i = 0;
        if (length.value > 5) i++;
        if (length.value > 10) i++;
        truck.setAttribute('length', truckLengths[i]);
    });

    width.addEventListener('input', (e) => {
        let i = 0;
        if (width.value > 3) i++;
        if (width.value > 6) i++;
        truck.setAttribute('width', truckWidths[i]);
    });

    form.querySelectorAll('input[name="distance"]').forEach(el => {
        el.addEventListener('change', (e) => {
            let distance = document.querySelector('input[name="distance"]:checked');
            truck.setAttribute('distance', distance.value);
        })
    })
}

function initialisePackageConveyor() {
    conveyors[0] = new Conveyor(document.getElementById('conveyor'));
}

function addBox() {
    const svgns = "http://www.w3.org/2000/svg",
        boxDisplay = document.createElementNS(svgns, 'rect'),
        box = new Box(boxDisplay);

    boxDisplay.setAttribute('width', 50);
    boxDisplay.setAttribute('height', 50);
    boxDisplay.style.fill = 'brown'

    conveyors[0].addBox(box);
}