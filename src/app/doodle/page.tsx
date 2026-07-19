"use client";

import DoodleGame from "@/components/DoodleGame";
import Stars from "@/components/Stars";

export default function DoodlePromoPage() {
  const handleFinish = (score: number) => {
    alert(`정화량 ${score}개로 게임 종료! (여기서 알림 신청 폼이나 앱스토어 링크로 이동)`);
  };

  return (
    <main className="min-h-screen bg-[#0b1026] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* 백그라운드 별 효과 재사용 */}
      <Stars />
      
      <div className="z-10 w-full flex flex-col items-center max-w-[430px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">아스트로펫 미니게임</h1>
          <p className="text-[#7de8c3] text-sm font-medium">우주 쓰레기를 터치해 점수를 획득하세요!</p>
        </div>
        
        {/* 독립적인 모듈로 제작되어 어디든 이식 가능한 컴포넌트 */}
        <DoodleGame onFinish={handleFinish} />

        <div className="mt-8 text-center bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
          <p className="text-white/70 text-xs">
            이 미니게임은 &lt;DoodleGame /&gt; 컴포넌트로 독립되어 있어<br/>어느 페이지에든 즉시 붙여넣어 홍보용으로 쓸 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}
