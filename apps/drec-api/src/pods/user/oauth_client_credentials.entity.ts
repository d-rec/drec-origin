import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

 

@Entity({ name: 'oauth_client_credentials'})
export class OauthClientCredentials {
  @PrimaryGeneratedColumn()
  id: number;

//   @Column()
//   userId: number;

  @Column({ unique: true })
  clientId: string;

  @Column()
  clientSecret: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}