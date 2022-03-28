const conveyorTemplate =
    `<svg class="conveyor" width="100" height="700" viewBox="0 0 100 700" fill="none"
    xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="700" fill="white" />
        <rect width="100" height="700" fill="#FFA4A4" />
        <path class="conveyor-path" d="M50 0V700" stroke="black" />
    </svg>`,
    truckLengths = ["short", "middle", "long"],
    truckWidths = ["narrow", "middle", "wide"],
    audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/e/e5/Tetris_theme.ogg');

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
        this.truck = null;
        this.svg = svg;
        this.refreshRate = 1000;
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
        this.svg.parentElement.appendChild(this.truck.truckImage)
    }

    removeTruck() {
        this.truck = null;
    }

    addBox(box) {
        this.svg.parentElement.appendChild(box.displayElement);
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
            box.displayElement.style.top = `${p.y}px`;
            // box.displayElement.style.left = `${p.x}px`;

            if (box.position == 1) {
                conveyor.boxes.remove(box);
            }
        }
    }
}

class Truck {
    constructor(length, width, type, distance) {
        this.len = length;
        this.width = width;
        this.type = type;
        this.distance = distance;
    }

    get truckImage() {
        let elem = document.createElement('div');
        elem.classList.add('truck-image');
        elem.setAttribute('distance', this.distance)
        elem.setAttribute('type', this.type)
        elem.innerHTML = `
            <div class="front"></div>
            <div class="trailer"></div>
            <div class="body"></div>
            <div class="wheel" style="bottom: 0; left: 15%"></div>
            <div class="wheel" style="bottom: 0; left: 75%"></div>
            <div class="wheel" style="bottom: 0; left: 90%"></div>`;

        let i = 0;
        if (this.len > 5) i++;
        if (this.len > 10) i++;
        elem.setAttribute('length', truckLengths[i]);

        i = 0;
        if (this.width > 3) i++;
        if (this.width > 6) i++;
        elem.setAttribute('width', truckWidths[i]);

        return elem;
    }
}

initialiseTruckVisualisation();

function initialiseTruckVisualisation() {
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

function addBox() {

    // Create a div with class box
    const boxDisplay = document.createElement('div'),
        box = new Box(boxDisplay);

    boxDisplay.classList.add('box');

    conveyors.forEach(e => e.addBox(box));
}

function addConveyor() {
    const wrapper = document.getElementsByClassName('wrapper')[0],
        column = document.createElement('div');

    column.classList.add('column');
    column.innerHTML = conveyorTemplate;

    wrapper.appendChild(column);

    const conveyor = new Conveyor(column.getElementsByClassName('conveyor')[0]);

    conveyors.push(conveyor);
}

function addTruck(truck) {
    conveyors.forEach(e => {
        if (e.truck == null) {
            return e.setTruck(truck);
        }
    });
}

function submitTruck() {
    let truckSerialized = serializeForm(document.getElementById('truck-form')),
        truck = new Truck(truckSerialized.len, truckSerialized.width, truckSerialized.type, truckSerialized.distance);

    console.log(truck);

    addTruck(truck);
    audio.play();
}

function serializeForm(form) {
    const inputs = form.querySelectorAll('input:not([type="submit"]), select, textarea'),
        result = [];

    inputs.forEach(e => {
        let value = e.value;
        if (e.getAttribute('type') != 'radio' || e.checked)
            result[e.getAttribute('name')] = value;
    });

    return result;
}