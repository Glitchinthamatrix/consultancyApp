console.log('index.js')
const navbar_menu = document.querySelector('.navbar__menu');


const activeLink = document.querySelector(`a[href='/${window.location.href.split('/')[3]}']`);
if (activeLink) activeLink.classList.add('navbar__menu__ul__item--active');



function modal_display(param) {

    param.parentElement.querySelector("#myModal").style.display = "block";

}


function dotsOption(param) {

    if (param.parentElement.querySelector("ul").style.display == "none")
        param.parentElement.querySelector("ul").style.display = "block";

    else
        param.parentElement.querySelector("ul").style.display = "none"
}

function toggleForm(id) {

    document.querySelector(".popup-medical").classList.remove("display_none");

    document.querySelector(".medicalForm").querySelector(".report_id").value = id;
}


async function searchValues(searchText, loc) {

    let http = new XMLHttpRequest();
    let url = '/getSearch';
    http.open("GET", url, true);

    //Show results in HTML
    const outputHtml = async(hospital_matches, type) => {
        if (loc) {
            if (hospital_matches.length > 0) {
                const html = hospital_matches.map(match => `
                                <div class="auto_value" onclick="addCityValue('${match}','${type}')">
                                <h4>${match} <span>${type}</span> </h4>
                                </div>`).join('')
                return html
            }
        } else {
            if (hospital_matches.length > 0) {
                const html = hospital_matches.map(match => `
                            <div class="auto_value" onclick="addValue('${match}','${type}')">
                            <h4>${match} <span>${type}</span> </h4>
                            </div>`).join('')
                return html
            }
        }
        return ''
    }

    http.onload = async(e) => {

        let response = JSON.parse(http.response);

        if (loc) {
            let location_matches = response.location.filter(hospital => {
                const regex = new RegExp(`^${searchText}`, 'gi');
                return hospital.match(regex)
            });
            if (searchText.length == 0) {
                location_matches = 0;
                matchlist.innerHTML = "";
            } else {
                locationhtml = await outputHtml(location_matches, "City");

                citylist.innerHTML = locationhtml;
            }
        } else {
            let hospital_matches = response.hospital.filter(hospital => {
                const regex = new RegExp(`^${searchText}`, 'gi');
                return hospital.match(regex)
            });

            let speciality_matches = response.specializations.filter(hospital => {
                const regex = new RegExp(`^${searchText}`, 'gi');
                return hospital.match(regex)
            });
            if (searchText.length == 0) {
                hospital_matches = 0;
                speciality_matches = 0;
                matchlist.innerHTML = "";
            } else {
                hospitalhtml = await outputHtml(hospital_matches, "Hospital");

                specialityhtml = await outputHtml(speciality_matches, "Specialization");
                matchlist.innerHTML = hospitalhtml + specialityhtml;
            }


        }

    }

    http.send();


}




let loc_search = document.getElementById("loc_search")


let matchlist = document.getElementById("match-list");

let citylist = document.getElementById("city-list");


if (window.location.href == "http://localhost:8000/") {
    if (search)
        search.addEventListener('input', () => searchValues(search.value));

    if (loc_search)
        loc_search.addEventListener('input', () => searchValues(loc_search.value, "location"));

    function addValue(value) {
        search.value = value;
        matchlist.innerHTML = "";
    }

    function addCityValue(value) {
        loc_search.value = value;
        citylist.innerHTML = "";
    }

}


function showMore(param) {
    let showList = param.parentElement.querySelectorAll('checkbox_container');
    showList.forEach(el => {
        if (el.classList.includes('display_none')) {
            el.classList.remove('display_none');
        }
    });
    param.parentElement.getElementById('show-less').classList.remove('display_none');
    param.classList.add('display_none');
}

function showLess(param) {
    let showList = param.parentElement.querySelectorAll('checkbox_container');
    showList.forEach((el, index) => {
        if (index > 5) {
            if (el.classList.includes('display_none')) {

            } else {
                el.classList.add('display_none');
            }
        }
    });
    param.parentElement.getElementById('show-more').classList.remove('display_none');
    param.classList.add('display_none');

}


function delReport(report_id, image_id) {

    let form = document.querySelector("#delReport");

    form.querySelector(".report_id").value = report_id;
    form.querySelector(".report_image").value = image_id;


    form.submit();

}


function modal_deactivate(param) {

    param.parentElement.style.display = "none";

}


function addAnother(param, event) {

    param.parentElement.style.backgroundImage = `url(${URL.createObjectURL(event.target.files[0])})`;
    param.parentElement.querySelector("label").style.display = "none";
    let div = document.createElement('div');
    let cn = param.parentElement.parentElement.querySelectorAll("input");
    div.setAttribute("class", "input_image_container");
    let input = document.createElement('input');
    input.setAttribute("type", "file");
    input.setAttribute("name", "medicalphoto[]");
    input.setAttribute("id", `_${cn.length+1}`);
    input.setAttribute("onchange", "addAnother(this,event)")
    input.setAttribute("multiple", "");
    let label = document.createElement('label');
    label.setAttribute("for", `_${cn.length+1}`)
    let p = document.createElement('p');
    p.innerText = "+";
    let small = document.createElement('p');

    small.innerText = "Add Photo";
    small.setAttribute("class", "small");
    label.appendChild(p)
    label.appendChild(small)
    div.appendChild(input)
    div.appendChild(label)


    param.parentElement.parentElement.appendChild(div);

}



function togglecancelMessage(id) {

    let form;
    if (document.querySelector(".change_phone_number_form_container").style.display == "none") {
        document.querySelector(".change_phone_number_form_container").style.display = "flex";
        if (document.querySelector("#cancel"))
            form = document.querySelector("#cancel").querySelector("input").value = id;
        else
            form = document.querySelector("#delete_record").querySelector("input").value = id;
    } else

        document.querySelector(".change_phone_number_form_container").style.display = "none";

}


function submitForm(value, id) {

    let form = document.querySelector("#" + value);

    if (form) {
        if (id)
            form.querySelector("input").value = id;
        if (form.querySelector("input").value)
            form.submit();
    }

}


function openRecords(id, e) {

    if (e.target.nodeName.toString() != "BUTTON")
        window.location.href = `/user-dashboard-medical-records/showReport/${id}`;

}




const toggleAccordian = element => {
    const item = element.target;
    const chevron = item.children[0].children[1];
    const content = item.children[1];
    content.classList.toggle('expandCollapse');
    chevron.classList.toggle('rotate_arrow');
}


const accordianItem = Array.from(document.querySelectorAll('.about_doctor__container__col--1__more_details__accordian__item'));
accordianItem.forEach(el => {
    el.addEventListener('click', toggleAccordian);
})



const sideMenuTreatments = document.getElementById('side_menu_treatments');
const sideMenutreatmentChevron = document.querySelector('#treatments_sideMenu');

if (sideMenutreatmentChevron) {
    sideMenutreatmentChevron.addEventListener('click', () => {
        sideMenuTreatments.classList.toggle('display_none')
    });

}



function findCity(param) {

    param.classList.toggle("colorchanger");
    let http = new XMLHttpRequest();
    let url = 'https://geolocation-db.com/json/0f761a30-fe14-11e9-b59f-e53803842572';
    http.open("GET", url, true);
    http.onload = async(e) => {

        let response = JSON.parse(http.response);

        param.parentElement.querySelector("input").value = response.city
        param.classList.toggle("colorchanger");
        param.style.color = "#2a2d3e";

    }

    http.onprogress = (e) => {


    }

    http.send();


}



const profileChevron = document.querySelector('.navbar__profile');
const profile_menu = document.querySelector('.profile_menu_container');

if (profileChevron) profileChevron.addEventListener('click', () => { profile_menu.classList.toggle('display_none') });

const treatmentChevron = document.querySelector('#treatments');
const treatment_menu = document.querySelector('#treatment_menu_container');
if (treatmentChevron) {
    treatmentChevron.addEventListener('mouseover', () => {
        treatment_menu.classList.toggle('display_none')
    });


    treatmentChevron.addEventListener('mouseout', () => {
        treatment_menu.classList.toggle('display_none')
    });

}



const expand = (element) => {
    // remove active class from any element.
    options.forEach(el => {
        el.classList.remove('how_it_works__grid__option-active');
    })

    // add active class to the element that is clicked
    let abc = element.target;
    let isOption = Array.from(abc.classList).indexOf('how_it_works__grid__option');
    if (isOption === -1) {
        abc = abc.parentElement
        abc.classList.add('how_it_works__grid__option-active');
    } else {
        abc.classList.add('how_it_works__grid__option-active');
    }

    // remove expand class from any element.
    option_desc.forEach(el => {
        el.classList.remove('how_it_works__grid__option__desc-expand');
    });

    // apply expand class to the appropriate element.
    abc.nextElementSibling.classList.add('how_it_works__grid__option__desc-expand');

    // Below will execute only when the screen size is mobile.



}

let options = Array.from(document.querySelectorAll('.how_it_works__grid__option'));
let option_desc = Array.from(document.querySelectorAll('.how_it_works__grid__option__desc'));

options.forEach(el => {
    el.addEventListener('click', expand);
});

// const autoCompleteFunc = () => {
// 	let autoComplete = new google.maps.places.Autocomplete(document.getElementById('auto-complete'));
// 	google.maps.event.addListener(autoComplete, 'place-changed', () => {
// 		let nearPlace = autoComplete.getPlacePredictions();
// 	});

// }


let menu_burger = document.querySelector('.navbar__burger');
let cross_button = document.querySelector('.cross');

const expand_menu = (el) => {
    let side_menu = document.querySelector('.navbar__side_menu');
    side_menu.style.display = 'inline';
}

const collapse_menu = (el) => {
    let side_menu = document.querySelector('.navbar__side_menu');
    side_menu.style.display = 'none';
}
if (cross_button) cross_button.addEventListener('click', collapse_menu);
if (menu_burger) menu_burger.addEventListener('click', expand_menu);

// autoCompleteFunc();

const activeDot = (el) => {
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove('dot_active');
        el.target.classList.add('dot_active');
    }
    return el.target.classList[1].split('-')[1];
}

const orderingCards = (start) => {
    let cardsToAppend = '';
    for (let i = 0; i < cards.length; i++) {
        cards[i].style.display = 'none';
    }
    let formula = (4 * start);
    cards[formula].style.display = 'grid';
    cards[formula + 1].style.display = 'grid';
    cards[formula + 2].style.display = 'grid';
    cards[formula + 3].style.display = 'grid';
}


let cards = Array.from(document.querySelectorAll('.carousel_item'));
cards[1].style.display = 'grid';
cards[0].style.display = 'grid';
cards[2].style.display = 'grid';
cards[3].style.display = 'grid';
let cards_container = document.querySelector('.carousel_container');
let dots = Array.from(document.querySelectorAll('.carousel_dot'));
for (let i = 0; i < dots.length; i++) {
    dots[i].addEventListener('click', el => {
        activeDot(el);
        let dot_number = parseInt(dots[i].dataset.number);
        orderingCards(dot_number);
    });
}










const toggleHospitals = (el) => {
    invisible_image_containers.forEach(el => {
        el.classList.toggle('more_hospital_display');
    })
    if (hospitals.children[0].children[0].textContent !== '- Less Hospitals')
        hospitals.children[0].children[0].textContent = '- Less Hospitals';
    else
        hospitals.children[0].children[0].textContent = '+ More Hospitals';
    // = '- Less Hospitals';
    if (window.matchMedia('(max-width: 767px)').matches) {

    } else {
        if (row_1.style.height !== '60rem')
            row_1.style.height = '60rem';
        else
            row_1.style.height = '35rem';
    }
}


const row_1 = document.querySelector('.row--1');
const hospitals = document.querySelector('.more_hospitals');
hospitals.addEventListener('click', toggleHospitals);
const invisible_image_containers = Array.from(document.querySelectorAll('.more_hospital_hidden'));