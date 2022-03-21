class Box {
    constructor(displayElement) {
        this.displayElement = displayElement
        this.position = 0.0;
        this.speed = 0.1;
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
        this.refreshRate = 1000;
        this.pathElement = svg.getElementById('path');
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
            box.displayElement.setAttribute("transform", `translate(${p.x}, ${p.y})`);

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
    const conveyor = new Conveyor(document.getElementById('conveyor'));
    setInterval(() => {
        const svgns = "http://www.w3.org/2000/svg",
            dot = document.createElementNS(svgns, 'circle'),
            box = new Box(dot);

        dot.setAttribute('r', 10);
        dot.setAttribute('cy', 0);
        dot.setAttribute('cx', 0);
        dot.setAttribute('fill', "#dd1819");

        conveyor.addBox(box);
    }, 3000);
}