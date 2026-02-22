import React from 'react';
import NFTCard from '../components/NFTCard';
import HomeTitle from '../components/HomeTitle';

function Home({ onArtworkSelect }) {
  return (
    <div className="pt-20 min-h-screen bg-brand-bg flex flex-col p-6 select-none">
      <div className="flex-1 flex flex-col justify-center space-y-2 select-none -translate-y-40 px-20">
        {/* <div className="flex space-x-4">
          <span>
            <p className="home-title">
              Pick
            </p>
          </span>
          <span>
            <p className="home-title">
              Your
            </p>
          </span>
          <span>
            <p className="home-title">
              Canvas
            </p>
          </span>
        </div> */}
        <HomeTitle />

        {/* Home.jsx: 카드들이 겹쳐서 나열될 하단 영역 */}
        {/* transform은 absolute 요소에 직접 걸지 않아야 fixed 자식(모달 등)의 좌표가 틀어지지 않음 */}
        <div className="absolute bottom-0 top-0 left-[40vw] flex justify-center items-end -space-x-36 pb-10
          animate-[fade-zoom-in_1s_cubic-bezier(.09,.9,.29,.96)_forwards]
        ">
          {/* 3D 기울기는 이 내부 래퍼에만 적용 */}
          <div className="flex justify-center items-end -space-x-36 pb-0
            perspective-[2000px]
            [transform:rotateX(10deg)_rotateY(5deg)_rotateZ(-3deg)]
            transition-all duration-500 ease-in-out
          ">

            {/* 카드 데이터 배열을 map으로 돌리면 더 편합니다 */}
            {[
              { id: "#00001", title: "별이 빛나는 밤에", artist: "빈센트 1/2 고흐" },
              { id: "#00002", title: "디지털 르네상스", artist: "비탈릭", img: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgdPvqe2c18ddlVe5K8fKzEyO-_WgFaItuKgEM3kb4vH85h6tVsRQSXR4_2L-Xd0INgDu6JG9V4xJfBTY14WsdLkmTIgXvkc1neJNW3p4nVDuZsu-y1doA5pvC4BOas6TUZDF6PNc95ntk/s1600/DSCN2523.JPG" },
              { id: "#00003", title: "얘 딴짓함", artist: "홍길동", img: "https://www.artbyalysia.com/uploads/6/1/6/5/61653353/7978579_orig.jpg" },
              { id: "#00004", title: "코드로 그린 풍경", artist: "이더리움", img: "https://i.pinimg.com/1200x/51/87/b1/5187b1e0dff46c926e5babeb76aca264.jpg" },
              { id: "#00005", title: "블록체인 속의 꿈", artist: "솔리디티", img: "https://www.sciencefriday.com/wp-content/uploads/2021/05/Vakseen-The_Resilience_of_a_Rose_8x8__Acrylic_on_wood_2020.jpg" },
            ].map((nft, index) => (
              <div
                key={nft.id}
                style={{ zIndex: index, transform: `translateY(${index * 40}px)` }} // 뒤에 오는 카드가 위로 오게 설정
                className="
        relative flex-shrink-0 
        w-[32vh] aspect-[1/1.618] 
        rounded-[2.5rem] bg-black/40 backdrop-blur-xl 
        border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.5)] 
        px-8 py-8 select-none z-10
        hover:-translate-y-20 hover:scale-105 hover:rotate-3 
        hover:z-[50] transition-all duration-300 cursor-pixel
      "
              >
                <NFTCard
                  imageSrc={nft.img}
                  title={nft.title}
                  artist={nft.artist}
                  id={nft.id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >
  );
}

export default Home;
