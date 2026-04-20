const counters = document.querySelectorAll('.card h2');

counters.forEach((counter) => {
    const target = Number(counter.getAttribute('data-target'));
    const increment = Math.max(1, Math.ceil(target / 90));

    const updateCounter = () => {
        const current = Number(counter.innerText);

        if (current < target) {
            counter.innerText = Math.min(target, current + increment);
            setTimeout(updateCounter, 18);
        } else {
            counter.innerText = target;
        }
    };

    updateCounter();
});

const reliefLocations = [
    {
        coords: [25.5941, 85.1376],
        title: 'Shelter Grove',
        detail: 'Community shelter stocked with blankets, drinking water, and child-safe support kits.',
        tag: 'Shelter Active',
        color: 'green'
    },
    {
        coords: [25.6127, 85.1589],
        title: 'Medical Aid Needed',
        detail: 'Mobile triage support requested for 35 injured civilians with priority medicine delivery.',
        tag: 'Critical Medical',
        color: 'orange'
    },
    {
        coords: [25.5784, 85.1219],
        title: 'Food Forest Hub',
        detail: 'Meal distribution and reusable container collection point now serving nearby camps.',
        tag: 'Food Distribution',
        color: 'yellow'
    },
    {
        coords: [25.6068, 85.1862],
        title: 'Rescue Boats',
        detail: 'Water rescue corridor is open with boats staged for evacuation along the canal edge.',
        tag: 'Water Rescue',
        color: 'blue'
    },
    {
        coords: [25.5669, 85.0847],
        title: 'Emergency Alert',
        detail: 'Grid instability and flood-risk escalation reported. Backup microgrid dispatch in review.',
        tag: 'Critical Alert',
        color: 'orange'
    }
];

const reliefMap = L.map('relief-map', {
    zoomControl: true,
    scrollWheelZoom: false
}).setView([25.5941, 85.1376], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(reliefMap);

reliefLocations.forEach((location) => {
    const marker = L.marker(location.coords, {
        icon: L.divIcon({
            className: '',
            html: `<div class="relief-marker ${location.color}"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -10]
        })
    }).addTo(reliefMap);

    marker.bindPopup(`
        <div class="popup-title">${location.title}</div>
        <div class="popup-meta">${location.detail}</div>
        <div class="popup-tag"><i class="fas fa-leaf"></i> ${location.tag}</div>
    `);
});

const mapBounds = L.latLngBounds(reliefLocations.map((location) => location.coords));
reliefMap.fitBounds(mapBounds.pad(0.12));

window.addEventListener('resize', () => {
    reliefMap.invalidateSize();
});

setInterval(() => {
    const status = document.querySelector('.status');
    status.style.transform = status.style.transform === 'scale(0.98)' ? 'scale(1)' : 'scale(0.98)';
}, 1400);