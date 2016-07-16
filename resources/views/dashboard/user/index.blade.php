@extends('layouts.dashboard')

@section('page_title')
    Пользователи
@endsection

@section('content_title')
    Список пользователей
@endsection()

@section('content')
    <?php $i = ($users->currentPage() - 1) * 10 + 1?>
    <table class="table">
        <thead>
        <th class="numberlist">№</th>
        <th>Имя</th>
        <th>E-mail</th>
        <th>Роли</th>
        <th>Действия</th>
        </thead>
        <tbody>
            @foreach($users as $user)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>{{ $user->getRolesAsString() }}</td>
                    <td>
                        <a class="btn btn-default btn-sm" href="{{ route('edit_user', $user->id) }}">Редактировать</a>
                        @unless($user->hasRole('admin'))
                            <a class="btn btn-danger btn-sm" href="{{ route('delete_user', $user->id) }}">Удалить</a>
                        @endunless
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    {{ $users->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_user') }}">Создать нового</a></p>
@endsection