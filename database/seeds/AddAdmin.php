<?php

use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AddAdmin extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('users')->insert([
            'name' => 'Admin',
            'email' => 'admin@admin.ru',
            'password' => bcrypt('123456'),
            'created_at' => Carbon::now()->toDateTimeString(),
            'updated_at' => Carbon::now()->toDateTimeString(),
        ]);
        \App\User::whereName('Admin')->first()->assignRole('admin');
    }
}
