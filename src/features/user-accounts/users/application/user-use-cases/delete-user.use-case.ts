import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserDocument } from '../../domain/user.entity';
import { UserRepository } from '../../infrastructure/user.repository';

export class DeleteUserUseCaseCommand {
  constructor(public id: string) {
  }
}

@CommandHandler(DeleteUserUseCaseCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserUseCaseCommand> {
  constructor(private userRepository: UserRepository) {
  }

  async execute(command: DeleteUserUseCaseCommand) {
    const user: UserDocument | null = await this.userRepository.findById(command.id);
    if (!user) return null;
    user.makeDeleted();
    await this.userRepository.save(user);
    return true;
  }
}