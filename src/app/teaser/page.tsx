import Stars from "@/components/Stars";
import EggSvg from "@/components/EggSvg";

export default function TeaserPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
      <Stars />
      
      <div className="z-10 max-w-[430px] w-full flex flex-col items-center">
        <p className="text-mint font-medium text-sm mb-4 tracking-wider">
          우주로 떠나보낸 펫과 마음을 주고받는 힐링 게임
        </p>
        
        <h1 className="text-3xl font-bold mb-12 text-white leading-tight">
          당신의 작은 우주 친구가<br/>곧 찾아옵니다
        </h1>
        
        <div className="mb-16 anim-bob drop-shadow-2xl">
          <EggSvg className="w-40 h-40" />
        </div>
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full mb-8 shadow-xl">
          <p className="text-lavender text-lg font-semibold mb-2">15분마다 돌아오는 재회 궤도</p>
          <p className="text-white/70 text-sm">작고 따뜻한 기적을 준비하고 있어요.</p>
        </div>
        
        <form className="w-full flex flex-col gap-3">
          <input 
            type="email" 
            placeholder="이메일을 남겨주시면 출시 때 알려드릴게요" 
            className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-mint transition-colors shadow-inner"
          />
          <button 
            type="button"
            className="w-full bg-mint text-space-dark font-bold py-3.5 rounded-xl hover:bg-pink hover:text-white transition-colors duration-300 shadow-lg"
          >
            출시 알림 받기
          </button>
        </form>
      </div>
    </main>
  );
}
