//Default gelen
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

//ekle
import { SQLiteObject, SQLite } from "@ionic-native/sqlite";
import { BehaviorSubject } from "rxjs/Rx";
import { SQLitePorter } from "@ionic-native/sqlite-porter";
import { Platform } from "ionic-angular";
import { Storage } from "@ionic/storage";

@Injectable()
export class DatabaseProvider {
  database: SQLiteObject;
  private databaseReady: BehaviorSubject<boolean>

  constructor(public http: Http,
    private sqlitePorter: SQLitePorter,
    private storage: Storage,
    private sqlite: SQLite,
    private platform: Platform) {
    this.databaseReady = new BehaviorSubject(false);
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'developers.db',
        location: 'default'
      })
        .then((db: SQLiteObject) => {
          this.database = db;
          this.storage.get('database_filled').then(val => {
            if (val) {
              this.databaseReady.next(true)
            } else {
              this.fillDatabase();
            }
          });
        });
    });
  }


  fillDatabase(){
    this.http.get('assets/dummyDump.sql')
    .map(r=>r.text()).subscribe(sql=>{
      this.sqlitePorter.importSqlToDb(this.database, sql)
      .then(data=>{
        this.databaseReady.next(true);
        this.storage.set('database_filled',true)
      })
      .catch(e =>{
        console.log(e)
      })
    });
  }

  addDeveloper(name, skill, year){
    let data = [name, skill, year];
    return this.database.executeSql('INSERT INTO developer (fullname, skill, yearsOfExperience) VALUES (?,?,?))',data).then(res=>{
      return res;
    });
  }

  getAllDevelopers(){
    return this.database.executeSql('SELECT * FROM developer', []).then(data=>{
      let developers = [];
      if(data.rows.length > 0){
        for(var i = 0; i < data.rows.length; i++){
          developers.push(
            {name: data.rows.item(i).name,
             skill: data.rows.item(i).skill,
             yearsOfExperience:data.rows.item(i).yearsOfExperience
          })
        }
      }
      return developers;
    }, err=>{
      console.log('Hata: ', err);
    })
  }


  getDatabaseState() {
    return this.databaseReady.asObservable();
  }

}
