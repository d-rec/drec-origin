import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'oauth_client_credentials' })
export class OauthClientCredentials {
  @PrimaryGeneratedColumn()
  id: number;

  //   @Column()
  //   userId: number;

  @Column({ unique: true, type: 'text' })
  client_id: string;
  /*
  @Column()
  client_secret: string;
*/
  @Column()
  api_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'api_user_id' })
  user: User;
}
