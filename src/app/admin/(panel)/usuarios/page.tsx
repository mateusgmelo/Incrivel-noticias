import { UserManager } from "@/components/admin/UserManager";
import { requireUser } from "@/server/core/auth/session";
import { usersService } from "@/server/modules/users/user.service";

export default async function UsersPage() {
  const me = await requireUser("ADMIN");
  const users = await usersService.list(me);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Usuários e permissões</h1>
      <UserManager users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))} meId={me.id} />
    </div>
  );
}
