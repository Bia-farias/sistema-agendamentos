import { prisma } from '../database/prisma';
import { hashPassword } from '../utils/password';

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.USER_EMAIL;
  const newPassword = args[1] || process.env.USER_PASSWORD;

  if (!email || !newPassword) {
    console.error('❌ Uso: npx tsx src/scripts/setUserPassword.ts <email> <novaSenha>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.error(`❌ Usuário com o e-mail "${email}" não foi encontrado no banco de dados.`);
      process.exit(1);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log(`✅ Senha do usuário "${user.email}" (${user.fullName}) atualizada com sucesso!`);
    console.log(`🔑 Nova senha definida com criptografia segura Bcrypt.`);
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

