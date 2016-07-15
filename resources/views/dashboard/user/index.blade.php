@extends('layouts.dashboard')

@section('content')
    <table class="table table-hover">
        <thead>
        <th class="numberlist">№</th>
        <th>Имя</th>
        <th>E-mail</th>
        <th>Роли</th>
        <th>Редактировать</th>
        </thead>
        <tbody>
        <?php $i = 0?>
            @foreach($users as $user)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>{{ $user->getRolesAsString() }}</td>
                    <td><a href="{{ route('edit_user', $user->id) }}">Редактировать</a></td>
                </tr>
            @endforeach
        </tbody>
    </table>


@endsection