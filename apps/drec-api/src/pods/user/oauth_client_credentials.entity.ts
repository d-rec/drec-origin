import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

 

@Entity({ name: 'oauth_client_credentials'})
export class OauthClientCredentials {
  @PrimaryGeneratedColumn()
  id: number;

//   @Column()
//   userId: number;

  @Column({ unique: true })
  client_id: string;

  @Column()
  client_secret: string;

  @Column()
  userid:number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;
}