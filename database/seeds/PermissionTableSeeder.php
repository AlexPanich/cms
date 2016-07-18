<?php

use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PermissionTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $permissions = [
            ['name' => 'view_dashboard',        'label' => 'View Dashboard Panel'],
            ['name' => 'edit_pages',            'label' => 'Edit Pages'],
            ['name' => 'edit_menus',            'label' => 'Edit Menus'],
            ['name' => 'edit_galleries',        'label' => 'Edit Galleries'],
            ['name' => 'edit_users',            'label' => 'Edit Users'],
            ['name' => 'edit_roles',            'label' => 'Edit Roles'],
            ['name' => 'edit_templates',        'label' => 'Edit Templates'],
            ['name' => 'edit_documents',        'label' => 'Edit Documents'],
            ['name' => 'edit_texts',            'label' => 'Edit Texts'],
            ['name' => 'edit_articles',         'label' => 'Edit Articles'],
            ['name' => 'edit_from_front',       'label' => 'Edit From Front'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->insert([
                'name' => $permission['name'],
                'label' => $permission['label'],
                'created_at' => Carbon::now()->toDateTimeString(),
                'updated_at' => Carbon::now()->toDateTimeString(),
            ]);
        }
    }
}
