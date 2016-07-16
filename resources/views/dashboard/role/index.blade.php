@extends('layouts.dashboard')

@section('page_title')
    Роли
@endsection

@section('content_title')
    Все роли
@endsection()

@section('content')
    <?php $i = ($roles->currentPage() - 1) * 10 + 1?>
    <table class="table">
        <thead>
        <th class="numberlist">№</th>
        <th>Название</th>
        <th>Описание</th>
        <th>Привелегии</th>
        <th style="width: 250px">Действия</th>
        </thead>
        <tbody>
            @foreach($roles as $role)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $role->name }}</td>
                    <td>{{ $role->label }}</td>
                    <td>{{ $role->getPermissionsAsString() }}</td>
                    <td>
                        <a class="btn btn-default btn-sm" href="{{ route('edit_role', $role->id) }}">Редактировать</a>
                        @unless($role->name =='admin')
                            <a class="btn btn-danger btn-sm" href="{{ route('delete_role', $role->id) }}">Удалить</a>
                        @endunless
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    {{ $roles->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_role') }}">Создать новую</a></p>
@endsection