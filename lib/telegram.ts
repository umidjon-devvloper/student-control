const TELEGRAM_BOT_TOKEN = "8751043417:AAFoHOFA5SNgep8xjcUjeXh7xw1YLkjfSsU"
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
}

export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN sozlanmagan");
      return false;
    }

    if (!message.chatId) {
      console.error("Chat ID talab qilinadi");
      return false;
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: message.chatId,
        text: message.text,
        parse_mode: message.parseMode || "HTML",
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram API xatosi:", data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Telegram xabarini yuborishda xatolik:", error);
    return false;
  }
}

export function formatStudentDailyReport(
  studentName: string,
  date: string,
  completedTasks: number,
  totalTasks: number,
  tasks: Array<{ title: string; completed: boolean; score?: number }>
): string {
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  let message = `📚 <b>Kunlik Hisobot</b>\n\n`;
  message += `👤 <b>O'quvchi:</b> ${studentName}\n`;
  message += `📅 <b>Sana:</b> ${date}\n`;
  message += `📊 <b>Progress:</b> ${completedTasks}/${totalTasks} vazifa (${progress}%)\n\n`;
  
  if (tasks.length > 0) {
    message += `<b>Vazifalar:</b>\n`;
    tasks.forEach((task, index) => {
      const status = task.completed ? "✅" : "❌";
      const score = task.score !== undefined ? ` - ${task.score}%` : "";
      message += `${index + 1}. ${status} ${task.title}${score}\n`;
    });
  } else {
    message += `ℹ️ Bugun vazifalar yo'q.\n`;
  }
  
  if (completedTasks === totalTasks && totalTasks > 0) {
    message += `\n🎉 <b>Ajoyib! Barcha vazifalar bajarildi!</b> 🎉`;
  } else if (completedTasks < totalTasks) {
    message += `\n⚠️ <b>${totalTasks - completedTasks} ta vazifa qoldi.</b>`;
  }
  
  return message;
}

export function formatParentNotification(
  studentName: string,
  date: string,
  completedTasks: number,
  totalTasks: number,
  pendingTasks: string[]
): string {
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  let message = `👨‍👩‍👧 <b>O'quvchi Kunlik Hisoboti</b>\n\n`;
  message += `👤 <b>O'quvchi:</b> ${studentName}\n`;
  message += `📅 <b>Sana:</b> ${date}\n`;
  message += `📊 <b>Progress:</b> ${completedTasks}/${totalTasks} vazifa (${progress}%)\n\n`;
  
  if (pendingTasks.length > 0) {
    message += `❌ <b>Bajarilmagan Vazifalar:</b>\n`;
    pendingTasks.forEach((task, index) => {
      message += `${index + 1}. ${task}\n`;
    });
    message += `\n⚠️ <b>Iltimos, farzandingizga vazifalarni bajarishini eslatib qo'ying.</b>`;
  } else if (totalTasks > 0) {
    message += `✅ <b>Barcha vazifalar bajarildi!</b> 🎉`;
  } else {
    message += `ℹ️ Bugun vazifalar yo'q.`;
  }
  
  return message;
}

export function formatTaskReminder(
  studentName: string,
  pendingTasks: number,
  deadline: string
): string {
  let message = `⏰ <b>Vazifa Eslatmasi</b>\n\n`;
  message += `👤 <b>O'quvchi:</b> ${studentName}\n`;
  message += `📋 <b>Bajarilmagan Vazifalar:</b> ${pendingTasks}\n`;
  message += `⏳ <b>Muddat:</b> ${deadline}\n\n`;
  message += `⚠️ <b>Iltimos, vazifalarni muddatidan oldin bajaring!</b>`;
  
  return message;
}

export function formatWeeklySummary(
  studentName: string,
  weekRange: string,
  stats: {
    totalTasks: number;
    completedTasks: number;
    averageScore: number;
    bestScore: number;
  }
): string {
  const progress = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  
  let message = `📊 <b>Haftalik Hisobot</b>\n\n`;
  message += `👤 <b>O'quvchi:</b> ${studentName}\n`;
  message += `📅 <b>Hafta:</b> ${weekRange}\n\n`;
  message += `📈 <b>Statistika:</b>\n`;
  message += `• Bajarilgan Vazifalar: ${stats.completedTasks}/${stats.totalTasks} (${progress}%)\n`;
  message += `• O'rtacha Ball: ${stats.averageScore}%\n`;
  message += `• Eng Yuqori Ball: ${stats.bestScore}%\n\n`;
  
  if (progress >= 80) {
    message += `🌟 <b>Bu hafta ajoyib ishladingiz!</b>`;
  } else if (progress >= 50) {
    message += `👍 <b>Yaxshi progress! Shunday davom eting!</b>`;
  } else {
    message += `💪 <b>Kelgusi hafta yanada qat'iyat bilan ishlang!</b>`;
  }
  
  return message;
}
