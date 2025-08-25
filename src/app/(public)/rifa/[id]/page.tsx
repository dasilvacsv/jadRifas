import { getRaffleData } from '@/features/rifas/actions';
import RaffleDetailClient from '@/features/rifas/raffle-detail-client';
import { notFound } from 'next/navigation';


export default async function RafflePage({ params }: { params: { id: string } }) {
  const result = await getRaffleData(params.id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const { raffle, paymentMethods, ticketsTakenCount } = result.data;

  return (
    <RaffleDetailClient 
      raffle={raffle}
      paymentMethods={paymentMethods}
      ticketsTakenCount={ticketsTakenCount}
    />
  );
}