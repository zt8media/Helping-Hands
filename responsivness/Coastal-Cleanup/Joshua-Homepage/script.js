// DOMContentLoaded ensures the HTML is fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var map;
    var geocoder;
    var autocomplete;
    var markers = []; // Array to store markers

    // Initializes the Google Map
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -34.397, lng: 150.644 },
            zoom: 8
        });
        geocoder = new google.maps.Geocoder();

        // Set up autocomplete for location input
        autocomplete = new google.maps.places.Autocomplete(
            document.getElementById('location'), { types: ['geocode'] });

        // Handles the event when a place is selected in the autocomplete dropdown
        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (place.geometry) {
                map.setCenter(place.geometry.location);
                addMarker(place.geometry.location, null);
            }
        });
    }

    // Adds markers to the map
    function addMarker(location, event) {
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });
        markers.push({ marker: marker, event: event });

        if (event) {
            var infoWindow = new google.maps.InfoWindow({
                content: `<div>
                            <strong>${event.title}</strong><br>
                            ${event.description || ''}<br>
                            ${event.start}<br>
                            ${event.end}
                          </div>`
            });

            marker.addListener('click', function() {
                infoWindow.open(map, marker);
            });
        }

        map.setCenter(location);
    }

    // Integration of FullCalendar
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            right: 'prev,next,today',
            center: 'title',
            left: 'dayGridMonth,dayGridWeek'
        },
        editable: true,
        events: '/events',
        eventClick: function(info) {
            var deleteModal = document.getElementById('deleteModal');
            deleteModal.style.display = 'block';

            document.getElementById('deleteConfirm').onclick = function() {
                deleteEvent(info.event.id).then(() => {
                    info.event.remove();
                    deleteModal.style.display = 'none';
                }).catch(error => {
                    alert('Failed to delete event. Please try again.');
                    console.error('Error deleting event:', error);
                });
            };

            document.getElementById('deleteCancel').onclick = function() {
                deleteModal.style.display = 'none';
            };

            document.getElementById('learnMoreBtn').onclick = function() {
                showEventDetails(info.event.extendedProps);
                deleteModal.style.display = 'none';
            };
        },
        eventDidMount: function(info) {
            geocoder.geocode({ 'address': info.event.extendedProps.location }, function(results, status) {
                if (status === 'OK') {
                    addMarker(results[0].geometry.location, info.event);
                } else {
                    console.error('Geocode was not successful for the following reason: ' + status);
                }
            });
        }
    });

    calendar.render();
    initMap();

    // Saves a new event to the server
    async function saveEvent(eventData) {
        try {
            const response = await fetch('/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error saving event:', errorData);
                alert(`Error saving event: ${errorData.message}`);
            } else {
                const newEvent = await response.json();
                calendar.addEvent(newEvent);
                geocoder.geocode({ 'address': eventData.location }, function(results, status) {
                    if (status === 'OK') {
                        addMarker(results[0].geometry.location, newEvent);
                    } else {
                        console.error('Geocode was not successful for the following reason: ' + status);
                    }
                });
            }
        } catch (error) {
            console.error('Request failed', error);
            alert('Error saving event. Please try again.');
        }
    }

    // Deletes an event from the server
    async function deleteEvent(eventId) {
        try {
            const response = await fetch(`/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error deleting event:', errorData);
                alert(`Error deleting event: ${errorData.message}`);
            } else {
                console.log('Event deleted successfully');
            }
        } catch (error) {
            console.error('Request failed', error);
            alert('Error deleting event. Please try again.');
        }
    }

    // Handle form submission for adding new events
    document.getElementById('eventForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('title').value,
            start: document.getElementById('start').value,
            end: document.getElementById('end').value,
            description: document.getElementById('description').value,
            location: document.getElementById('location').value
        };

        try {
            console.log('Submitting form data:', formData);
            const response = await fetch('/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const newEvent = await response.json();
                console.log('New event added:', newEvent);
                calendar.addEvent(newEvent);
                alert('Event added successfully!');
                document.getElementById('eventForm').reset();

                geocoder.geocode({ 'address': formData.location }, function(results, status) {
                    if (status === 'OK') {
                        addMarker(results[0].geometry.location, newEvent);
                    } else {
                        alert('Geocode was not successful for the following reason: ' + status);
                    }
                });
            } else {
                const errorData = await response.json();
                console.error('Error adding event:', errorData);
                alert(`Error adding event: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Request failed', error);
            alert('Error adding event. Please try again.');
        }
    });
});

// Handles navbar responsiveness
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open'); // Toggle the side menu
    });
});

// Sets the active link based on the current page
document.addEventListener("DOMContentLoaded", function() {
    const currentLocation = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links .nav-item');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            link.classList.add('active');
        }
    });
});



// log in information 
document.addEventListener("DOMContentLoaded", function() {
    var loginBtn = document.getElementById('login-btn');
    var loginModal = document.getElementById('loginModal');
    var closeModalBtn = document.querySelector('.close-btn');
    var switchToSignUpBtn = document.getElementById('signUp');
    var switchToLoginBtn = document.getElementById('login');
    var loginForm = document.getElementById('login-form');
    var signUpForm = document.getElementById('signUp-form');

    // Show modal
    loginBtn.addEventListener('click', function() {
        loginModal.style.display = "block";
    });

    // Close modal
    closeModalBtn.addEventListener('click', function() {
        loginModal.style.display = "none";
    });

    // Close modal if click outside of modal content
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = "none";
        }
    });

    // // Switch to Sign Up form
    // switchToSignUpBtn.addEventListener('click', function() {
    //     loginForm.classList.add('hide');
    //     signUpForm.classList.remove('hide');
    // });

    // // Switch to Login form
    // switchToLoginBtn.addEventListener('click', function() {
    //     signUpForm.classList.add('hide');
    //     loginForm.classList.remove('hide');
    // });
 
    // Close the hamburger menu and show the login modal
 loginBtn.addEventListener('click', () => {
    navLinks.classList.remove('open'); // Close the side menu
    loginModal.style.display = "block";
});
    // Form elements and validation functions
    const login_username = document.getElementById('login-username');
    const signUp_username = document.getElementById('signUp-username');
    const login_password = document.getElementById('login-password');
    const signUp_password = document.getElementById('signUp-password');
    const signUp_email = document.getElementById('signUp-email');

    function loginValidation() {
        const username = login_username;
        const password = login_password;
        let passed = true;
        username.classList.remove('red-border');
        password.classList.remove('red-border');
        if (username.value === '' || !/^[a-zA-Z0-9]{4,}$/.test(username.value)) {
            username.classList.add('red-border');
            passed = false;
        }
        if (password.value === '' || !/^[a-zA-Z0-9]{4,}$/.test(password.value)) {
            password.classList.add('red-border');
            passed = false;
        }
        return passed;
    }

    function signValidation() {
        const email = signUp_email;
        const username = signUp_username;
        const password = signUp_password;
        let passed = true;
        email.classList.remove('red-border');
        username.classList.remove('red-border');
        password.classList.remove('red-border');
        if (email.value === '' || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.value)) {
            email.classList.add('red-border');
            passed = false;
        }
        if (username.value === '' || !/^[a-zA-Z0-9]{4,}$/.test(username.value)) {
            username.classList.add('red-border');
            passed = false;
        }
        if (password.value === '' || !/^[a-zA-Z0-9]{4,}$/.test(password.value)) {
            password.classList.add('red-border');
            passed = false;
        }
        return passed;
    }

    // Form submission event listeners
    document.getElementById('login-submit').addEventListener('click', (event) => {
        event.preventDefault();
        if (!loginValidation()) {
            return;
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: login_username.value,
                password: login_password.value
            })
        };
        fetch('/login', options)
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                }
                document.cookie = `token=${data.token}; path=/;`;
                window.location = data.admin ? '/admin' : '/home';
            })
            .catch(error => console.error(error));
    });

    document.getElementById('signUp-submit').addEventListener('click', (event) => {
        event.preventDefault();
        if (!signValidation()) {
            return;
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: signUp_email.value,
                username: signUp_username.value,
                password: signUp_password.value
            })
        };
        fetch('/signup', options)
            .then(response => response.json())
            .then(data => {
                if (response.status === 409) {
                    alert('Username already exists');
                    return;
                }
                if (response.status === 500) {
                    alert('Internal server error');
                    return;
                }
                window.location = data.admin ? '/admin' : '/home';
            })
            .catch(error => console.error(error));
    });

    // Form switch event listeners
    document.getElementById('signUp').addEventListener('click', () => {
        loginForm.classList.add('hide');
        signUpForm.classList.remove('hide');
    });

    document.getElementById('login').addEventListener('click', () => {
        signUpForm.classList.add('hide');
        loginForm.classList.remove('hide');
    });
});

//END of form javascript

//speech butoon 

       // Check for browser support
       window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

       if (window.SpeechRecognition) {
           const recognition = new SpeechRecognition();
           recognition.continuous = false;
           recognition.interimResults = false;

           const startRecordBtn = document.getElementById('start-record-btn');
           const descriptionInput = document.getElementById('description');

           startRecordBtn.addEventListener('click', () => {
               recognition.start();
           });

           recognition.addEventListener('result', (event) => {
               const transcript = event.results[0][0].transcript;
               descriptionInput.value += transcript;
           });

           recognition.addEventListener('end', () => {
               recognition.stop();
           });
       } else {
           console.log('Speech recognition not supported in this browser.');
       }

       
       