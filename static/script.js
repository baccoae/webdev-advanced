let storeItem = document.querySelectorAll(".card")

function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.defaults({ toggleActions: "play none none none" });

for (let i = 0; i < storeItem.length; i++) {
    let storeBorder = storeItem[i].children[1];

    if (storeItem[i].getBoundingClientRect().top < window.innerHeight - 0) {
        gsap.from(storeItem[i].children[0], {
            y: "50px",
            duration: .4,
            ease: "power3.out",
            // stagger: 0.03,
            delay: i * 0.015,
        })

        gsap.from(storeBorder, {
            width: 0,
            duration: .4,
            ease: "power3.out",
            delay: i * 0.015,
        })
    }
    else {
        gsap.from(storeItem[i].children[0], {
            y: "50px",
            duration: .4,
            ease: "power3.out",
            stagger: 0.03,
            scrollTrigger: {
                trigger: storeItem[i],
                start: "top 95%",
                end: "top 95%",
                scrub: 5,
                once: true,
                // markers: true,
            }
        })

        gsap.from(storeBorder, {
            width: 0,
            duration: .4,
            ease: "power3.out",
            stagger: 0.03,
            scrollTrigger: {
                trigger: storeItem[i],
                start: "top 95%",
                end: "top 95%",
                scrub: 5,
                once: true,
                // markers: true,
            }

        })
    }
}