document.addEventListener('DOMContentLoaded', () => {
    // 애니메이션을 적용할 모든 'hidden' 클래스 요소를 선택합니다.
    const hiddenElements = document.querySelectorAll('.hidden');

    // Intersection Observer 생성
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // entry.isIntersecting 은 요소가 화면에 보이는지 여부를 알려줍니다.
            if (entry.isIntersecting) {
                // 화면에 보이면 'visible' 클래스를 추가하여 애니메이션을 실행합니다.
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.2 // 요소가 20% 보였을 때 애니메이션을 시작합니다.
    });

    // 각 'hidden' 요소에 대해 관찰을 시작합니다.
    hiddenElements.forEach(el => observer.observe(el));
});